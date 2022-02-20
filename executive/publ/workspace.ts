import { colors, events, path } from "../../core/deps.ts";
import { oak } from "./deps.ts";
import * as wfs from "../../lib/fs/watch.ts";

export interface WorkspaceTunnelConnection {
  readonly sseTarget: oak.ServerSentEventTarget;
}

export class WorkspaceTunnel<
  Connection extends WorkspaceTunnelConnection = WorkspaceTunnelConnection,
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
  fileImpact(url: string, fsAbsPathAndFileName: string): void;
}> {
  #connections: Connection[] = [];
  #onlyOpen: ((value: Connection) => boolean) = (c) =>
    c.sseTarget.closed ? false : true;

  constructor(
    readonly sseHealthEndpointURL: string,
    readonly sseEndpointURL: string,
    readonly factory: (ctx: ConnectionContext) => Connection,
  ) {
    super();
    this.on("ping", () => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchEvent(new oak.ServerSentEvent("ping", {}))
      );
    });
    this.on("fileImpact", (url, fsAbsPathAndFileName) => {
      this.cleanConnections().forEach((c) =>
        c.sseTarget.dispatchEvent(
          new oak.ServerSentEvent("workspace.file-impact", {
            url,
            fsAbsPathAndFileName,
          }),
        )
      );
    });
  }

  get connections(): Connection[] {
    return this.#connections;
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
    }
    return connection;
  }

  // deno-lint-ignore require-await
  async cleanup() {
    this.cleanConnections().forEach((c) => c.sseTarget.close());
  }
}

export interface WorkspaceMiddlewareSupplierOptions {
  readonly tunnel: WorkspaceTunnel;
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;
}

export class WorkspaceMiddlewareSupplier {
  readonly tunnel: WorkspaceTunnel;
  readonly htmlEndpointURL: string;

  constructor(
    readonly config: {
      readonly contentRootPath: string;
      readonly fsEntryPublicationURL: (
        fsAbsPathAndFileName: string,
      ) => string | undefined;
      readonly publicURL: (path?: string) => string;
    },
    readonly app: oak.Application,
    readonly router: oak.Router,
    options?: Partial<WorkspaceMiddlewareSupplierOptions>,
  ) {
    this.htmlEndpointURL = options?.htmlEndpointURL ?? "/workspace";
    this.tunnel = options?.tunnel ??
      new WorkspaceTunnel(
        `${this.htmlEndpointURL}/sse/ping`,
        `${this.htmlEndpointURL}/sse/tunnel`,
        (ctx) => ({ sseTarget: ctx.oakCtx.sendEvents() }),
      );

    router.get(this.tunnel.sseHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `SSE endpoint ${this.tunnel.sseEndpointURL} available`;
      this.tunnel.emit("sseHealthRequest", { oakCtx: ctx });
    });

    router.get(this.tunnel.sseEndpointURL, (ctx) => {
      if (ctx.request.accepts("text/event-stream")) {
        this.tunnel.connect({ oakCtx: ctx });
      } else {
        this.tunnel.emit("sseInvalidRequest", { oakCtx: ctx });
      }
    });
  }

  *watchableFileSysPaths(): Generator<wfs.WatchableFileSysPath> {
    const contentRootPathEE = new wfs.WatchableFileSysEventEmitter();
    const contentRootPath = path.isAbsolute(this.config.contentRootPath)
      ? this.config.contentRootPath
      : path.resolve(Deno.cwd(), this.config.contentRootPath);
    const relWatchPath = (target: string) =>
      path.relative(
        contentRootPath,
        target,
      );
    // deno-lint-ignore require-await
    contentRootPathEE.on("modify", async (modified) => {
      if (modified.endsWith(".ts")) {
        console.info(
          colors.magenta(
            `*** ${
              colors.yellow(relWatchPath(modified))
            } script file change detected ***`,
          ),
          colors.yellow(
            colors.underline("pubctl.ts (hot reload) server restart required"),
          ),
        );
        return;
      }
      this.tunnel.emitSync(
        "fileImpact",
        this.config.fsEntryPublicationURL(modified) ??
          this.config.publicURL(),
        modified,
      );

      // deno-fmt-ignore
      console.info(colors.magenta(`*** ${colors.yellow(relWatchPath(modified))} file change detected *** ${colors.gray(`${this.tunnel.connections.length || 0} browser tab refresh requests sent`)}`));
    });
    // deno-lint-ignore require-await
    contentRootPathEE.on("create", async (created) => {
      console.log(
        colors.magenta(`*** ${relWatchPath(created)} created ***`),
        colors.yellow(
          colors.underline("pubctl.ts (hot reload) server restart required"),
        ),
      );
    });
    // deno-lint-ignore require-await
    contentRootPathEE.on("remove", async (deleted) => {
      console.log(
        colors.magenta(`*** ${relWatchPath(deleted)} deleted ***`),
        colors.yellow(
          colors.underline("pubctl.ts (hot reload) server restart required"),
        ),
      );
    });
    yield wfs.typicalWatchableFS(contentRootPath, contentRootPathEE);
  }
}
