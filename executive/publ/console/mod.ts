import { colors, events, path } from "../../../core/deps.ts";
import { oak } from "../deps.ts";
import * as s from "../static.ts";
import * as wfs from "../../../lib/fs/watch.ts";
import * as ping from "../../../lib/service-bus/service/ping.ts";
import * as fis from "../../../lib/service-bus/service/file-impact.ts";
import * as uaows from "./service/open-user-agent-window.ts";
import * as las from "./service/log-access.ts";

export interface ConsoleTunnelConnection {
  readonly sseTarget: oak.ServerSentEventTarget;
}

export class ConsoleTunnel<
  Connection extends ConsoleTunnelConnection = ConsoleTunnelConnection,
  // deno-lint-ignore no-explicit-any
  ConnectionContext extends { oakCtx: oak.Context<any> } = {
    // deno-lint-ignore no-explicit-any
    oakCtx: oak.Context<any>;
  },
> extends events.EventEmitter<{
  sseHealthRequest(ctx: ConnectionContext): void;
  sseConnected(conn: Connection, ctx: ConnectionContext): void;
  sseInvalidRequest(ctx: ConnectionContext): void;
  ping(): void;
  serverFileImpact(fsAbsPathAndFileName: string, url?: string): void;
  uaOpenWindow(location: string, target: "console-prime"): void;
  logAccess(sat: s.StaticServedTarget): void;
  featureState(feature: string, state: unknown): void;
}> {
  #connections: Connection[] = [];
  #onlyOpen: ((value: Connection) => boolean) = (c) =>
    c.sseTarget.closed ? false : true;
  #isAccessLoggingEnabled = false; // this can be slow so be careful

  constructor(
    readonly sseHealthEndpointURL: string,
    readonly sseEndpointURL: string,
    readonly factory: (ctx: ConnectionContext) => Connection,
  ) {
    super();
    this.on(ping.pingPayloadIdentity, () => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchMessage(ping.pingPayload())
      );
    });
    this.on(
      fis.serverFileImpactPayloadIdentity,
      (fsAbsPathAndFileName, url) => {
        this.cleanConnections().forEach((c) =>
          c.sseTarget.dispatchMessage(fis.serverFileImpact({
            serverFsAbsPathAndFileName: fsAbsPathAndFileName,
            relativeUserAgentLocation: url,
          }))
        );
      },
    );
    this.on(uaows.uaOpenWindowPayloadIdentity, (location, target) => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchMessage(uaows.userAgentOpenWindow({
          location,
          target,
        }))
      );
    });
    this.on(las.logAccessPayloadIdentity, (sat) => {
      if (this.#isAccessLoggingEnabled) {
        this.cleanConnections().forEach((c) =>
          c.sseTarget.dispatchMessage(las.logAccess(sat))
        );
      }
    });
    this.on("featureState", (feature, state) => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchEvent(
          new oak.ServerSentEvent("feature-state", { feature, state }),
        )
      );
    });
  }

  get connections(): Connection[] {
    return this.#connections;
  }

  get isAccessLoggingEnabled() {
    return this.#isAccessLoggingEnabled;
  }

  set isAccessLoggingEnabled(value: boolean) {
    this.#isAccessLoggingEnabled = value;
  }

  protected cleanConnections(): Connection[] {
    this.#connections = this.#connections.filter(this.#onlyOpen);
    return this.#connections;
  }

  connect(ctx: ConnectionContext, pingOnConnect = true): Connection {
    const connection = this.factory(ctx);
    this.cleanConnections().push(this.factory(ctx));
    this.emit("sseConnected", connection, ctx);
    if (pingOnConnect) {
      this.emit("ping");
      this.emit(
        "featureState",
        "isAccessLoggingEnabled",
        this.isAccessLoggingEnabled,
      );
    }
    return connection;
  }

  // deno-lint-ignore require-await
  async cleanup() {
    this.cleanConnections().forEach((c) => c.sseTarget.close());
  }
}

export interface ConsoleMiddlewareSupplierOptions {
  readonly tunnel: ConsoleTunnel;
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;
  readonly openWindowOnInit?: { url: string };
}

export class ConsoleMiddlewareSupplier {
  readonly contentHome = path.join(
    path.dirname(import.meta.url).substring(
      "file://".length,
    ),
    "public",
  );
  readonly tunnel: ConsoleTunnel;
  readonly openWindowOnInit?: { url: string };
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;

  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly staticEE: s.StaticEventEmitter,
    options?: Partial<ConsoleMiddlewareSupplierOptions>,
  ) {
    this.htmlEndpointURL = options?.htmlEndpointURL ?? "/console";
    this.staticIndex = "index.html";
    this.tunnel = options?.tunnel ??
      new ConsoleTunnel(
        `${this.htmlEndpointURL}/sse/ping`,
        `${this.htmlEndpointURL}/sse/tunnel`,
        (ctx) => ({ sseTarget: ctx.oakCtx.sendEvents() }),
      );

    router.get(this.tunnel.sseHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `SSE endpoint ${this.tunnel.sseEndpointURL} available`;
      this.tunnel.emit("sseHealthRequest", { oakCtx: ctx });
    });

    router.post(`${this.htmlEndpointURL}/user-agent-bus`, async (ctx) => {
      const body = ctx.request.body();
      const message = JSON.parse(await body.value);
      if (message.tuiHookIdentity == "tuiHook_isAccessLoggingEnabled") {
        this.tunnel.isAccessLoggingEnabled = message.state;
      }
      ctx.response.body = JSON.stringify(message);
    });

    router.get(this.tunnel.sseEndpointURL, (ctx) => {
      if (ctx.request.accepts("text/event-stream")) {
        this.tunnel.connect({ oakCtx: ctx });
        if (options?.openWindowOnInit) {
          this.tunnel.emit(
            "uaOpenWindow",
            options.openWindowOnInit.url,
            "console-prime",
          );
        }
      } else {
        this.tunnel.emit("sseInvalidRequest", { oakCtx: ctx });
      }
    });

    [{
      endpoint: `${this.htmlEndpointURL}/proxy/factory`,
      home: () =>
        path.resolve(
          path.fromFileUrl(import.meta.url),
          "../../../..",
        ),
    }].forEach((proxy) => {
      router.get(
        `${proxy.endpoint}/(.*)`,
        s.staticContentMiddleware(
          {
            staticAssetsHome: proxy.home(),
          },
          this.staticEE,
          this.staticIndex,
          (requestUrlPath) => requestUrlPath.substring(proxy.endpoint.length),
        ),
      );
    });

    router.get(
      `${this.htmlEndpointURL}/(.*)`,
      s.staticContentMiddleware(
        { staticAssetsHome: this.contentHome },
        this.staticEE,
        this.staticIndex,
        (requestUrlPath) =>
          requestUrlPath.substring(this.htmlEndpointURL.length),
      ),
    );
  }

  *watchableFileSysPaths(): Generator<wfs.WatchableFileSysPath> {
    const contentRootPathEE = new wfs.WatchableFileSysEventEmitter();
    const relWatchPath = (target: string) =>
      path.relative(this.contentHome, target);
    // deno-lint-ignore require-await
    contentRootPathEE.on("impacted", async ({ path: modified }) => {
      this.tunnel.emit("serverFileImpact", modified);
      // deno-fmt-ignore
      console.info(colors.magenta(`*** ${colors.yellow(relWatchPath(modified))} impacted *** ${colors.gray(`${this.tunnel.connections.length} browser tab refresh requests sent`)}`));
    });
    yield wfs.typicalWatchableFS(this.contentHome, contentRootPathEE);
  }

  // deno-lint-ignore require-await
  async staticAccess(event: s.StaticServedEvent) {
    if (event.target) {
      this.tunnel.emit("logAccess", event.target);
    }
  }
}
