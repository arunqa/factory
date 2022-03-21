import { colors, events, path } from "../../../../../core/deps.ts";
import { oak } from "../../deps.ts";
import * as s from "../static.ts";
import * as wfs from "../../../../../lib/fs/watch.ts";
import * as ping from "../../../../../lib/service-bus/service/ping.ts";
import * as fis from "../../../../../lib/service-bus/service/file-impact.ts";
// import * as uaows from "./service/open-user-agent-window.ts";
import * as db from "../../../publication-db.ts";
import * as rflPath from "../../../../../lib/path/mod.ts";

import * as rfStd from "../../../../../core/std/mod.ts";
import * as p from "../../../publication.ts";

import * as safety from "../../../../../lib/safety/mod.ts";

import * as ds from "../../../../../core/render/html/mod.ts";
import * as lds from "../../../../../core/design-system/lightning/mod.ts";

const modulePath = rflPath.pathRelativeToModuleCWD(import.meta.url);

export class ConsoleSiteConfiguration
  extends p.Configuration<p.PublicationOperationalContext> {
  constructor(
    readonly publication: p.Publication<p.PublicationOperationalContext>,
  ) {
    super({
      appName: "rfConsole",
      operationalCtx: {
        processStartTimestamp: new Date(),
        projectRootPath: modulePath,
        publStateDB: publication.config.operationalCtx.publStateDB,
        publStateDbLocation:
          publication.config.operationalCtx.publStateDbLocation,
      },
      contentRootPath: modulePath("content"),
      destRootPath: modulePath("public"),
      extensionsManager: publication.config.extensionsManager,
      // routeLocationResolver: publication.config.routeLocationResolver,
      // mGitResolvers: publication.config.mGitResolvers,
      // routeGitRemoteResolver: publication.config.routeGitRemoteResolver,
      // wsEditorResolver: publication.config.wsEditorResolver,
      memoizeProducers: true,
    });
  }
}

export interface VisualCuesFrontmatter {
  readonly "syntax-highlight": "highlight.js";
}

export const isVisualCuesFrontmatter = safety.typeGuard<VisualCuesFrontmatter>(
  "syntax-highlight",
);

export const isVisualCuesFrontmatterSupplier = safety.typeGuard<
  { "visual-cues": VisualCuesFrontmatter }
>("visual-cues");

export class ConsoleDesignSystem implements lds.LightningDesignSystemFactory {
  readonly designSystem: lds.LightingDesignSystem<lds.LightningLayout>;
  readonly contentStrategy: lds.LightingDesignSystemContentStrategy;

  constructor(
    config: p.Configuration<p.PublicationOperationalContext>,
    routes: p.PublicationRoutes,
  ) {
    this.designSystem = new lds.LightingDesignSystem(
      config.extensionsManager,
      "/universal-cc",
    );
    this.contentStrategy = {
      git: config.git,
      layoutText: new lds.LightingDesignSystemText(),
      navigation: new lds.LightingDesignSystemNavigation(
        true,
        routes.navigationTree,
      ),
      assets: this.designSystem.assets(),
      branding: {
        contextBarSubject: config.appName,
        contextBarSubjectImageSrc: (assets) =>
          assets.image("/asset/image/brand/logo-icon-100x100.png"),
      },
      mGitResolvers: config.mGitResolvers,
      routeGitRemoteResolver: config.routeGitRemoteResolver,
      renderedAt: new Date(),
      wsEditorResolver: config.wsEditorResolver,
      wsEditorRouteResolver: config.wsEditorResolver
        ? rfStd.defaultRouteWorkspaceEditorResolver(
          config.wsEditorResolver,
        )
        : undefined,
      initContributions: (layout) => {
        const suggested = layout.designSystem.contributions();
        if (layout.frontmatter) {
          return this.frontmatterInitContribs(layout, suggested);
        }
        suggested.scripts.aft
          `<script src="/script/social-proof-wc/social-proof.js"></script>`;
        return suggested;
      },
      termsManager: config.termsManager,
      operationalCtxClientCargo: {
        acquireFromURL: "/operational-context/index.json",
        assetsBaseURL: "/operational-context",
      },
    };
  }

  frontmatterInitContribs(
    layout: Omit<lds.LightningLayout, "contributions">,
    suggested: ds.HtmlLayoutContributions,
  ): ds.HtmlLayoutContributions {
    if (layout.frontmatter) {
      if (isVisualCuesFrontmatterSupplier(layout.frontmatter)) {
        const visualCues = layout.frontmatter?.["visual-cues"];
        if (isVisualCuesFrontmatter(visualCues)) {
          const highlighter = visualCues["syntax-highlight"];
          switch (highlighter) {
            case "highlight.js":
              suggested.stylesheets.aft
                `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css">`;
              suggested.scripts.aft
                `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>`;
              suggested.body.aft`<script>hljs.highlightAll();</script>`;
              break;
            default:
              // TODO: report as lint diagnostic or some other way
              console.error(
                `Frontmatter "visual-cues"."syntax-highlighter" is invalid type: "${highlighter}" in ${layout
                  .activeRoute?.terminal?.qualifiedPath}`,
              );
          }
        }
      }
    }
    return suggested;
  }
}

export class ConsoleSite
  extends p.TypicalPublication<p.PublicationOperationalContext> {
  constructor(config: ConsoleSiteConfiguration) {
    super(config);
  }

  constructDesignSystem(
    config: p.Configuration<p.PublicationOperationalContext>,
    routes: p.PublicationRoutes,
  ) {
    return new ConsoleDesignSystem(config, routes);
  }
}

export interface ConsoleTunnelConnection {
  readonly userAgentID: string;
  readonly sseTarget: oak.ServerSentEventTarget;
}

export class ConsoleTunnel<
  Connection extends ConsoleTunnelConnection = ConsoleTunnelConnection,
  ConnectionContext extends {
    // deno-lint-ignore no-explicit-any
    readonly oakCtx: oak.Context<any>;
    readonly userAgentIdSupplier: (ctx: oak.Context) => string;
  } = {
    // deno-lint-ignore no-explicit-any
    readonly oakCtx: oak.Context<any>;
    readonly userAgentIdSupplier: (ctx: oak.Context) => string;
  },
> extends events.EventEmitter<{
  sseHealthRequest(ctx: ConnectionContext): void;
  sseConnected(conn: Connection, ctx: ConnectionContext): void;
  sseInvalidRequest(ctx: ConnectionContext): void;
  serverFileImpact(fsAbsPathAndFileName: string, url?: string): void;
  uaOpenWindow(location: string, target: "console-prime"): void;
}> {
  #connections: Connection[] = [];
  #onlyOpen: ((value: Connection) => boolean) = (c) =>
    c.sseTarget.closed ? false : true;
  #isAccessLoggingEnabled = false; // this can be slow so be careful

  constructor(
    readonly sseHealthEndpointURL: string,
    readonly sseEndpointURL: string,
    readonly factory: (
      userAgentID: string,
      ctx: ConnectionContext,
    ) => Connection,
    readonly serverStateDB?: db.PublicationDatabase,
  ) {
    super();
    // this.on("sseConnected", (conn, ctx) => {
    //   console.log(
    //     `[${this.#connections.length}] ConsoleTunnelConnection ${conn.userAgentID}, ${ctx.oakCtx.request.url}`,
    //   );
    // });
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
    // this.on(uaows.uaOpenWindowPayloadIdentity, (location, target) => {
    //   this.cleanConnections().forEach((c) =>
    //     c.sseTarget.dispatchMessage(uaows.userAgentOpenWindow({
    //       location,
    //       target,
    //     }))
    //   );
    // });
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
    const userAgentID = ctx.userAgentIdSupplier(ctx.oakCtx);
    this.cleanConnections();
    const foundConnIndex = this.#connections.findIndex((c) =>
      c.userAgentID == userAgentID
    );
    if (foundConnIndex != -1) {
      const foundConn = this.#connections[foundConnIndex];
      foundConn.sseTarget.close();
    }
    const connection = this.factory(userAgentID, ctx);
    if (foundConnIndex != -1) {
      this.#connections[foundConnIndex] = connection;
    } else {
      this.#connections.push(connection);
    }
    this.emit("sseConnected", connection, ctx);
    if (pingOnConnect) {
      connection.sseTarget.dispatchMessage(ping.pingPayload());
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
  readonly consoleSiteConfig: ConsoleSiteConfiguration;
  readonly tunnel: ConsoleTunnel;
  readonly openWindowOnInit?: { url: string };
  readonly htmlEndpointURL: string;
  readonly staticIndex: "index.html" | string;
  #consoleSite?: ConsoleSite;

  constructor(
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly staticEE: s.StaticEventEmitter,
    readonly serverStateDB: db.PublicationDatabase | undefined,
    readonly userAgentIdSupplier: (ctx: oak.Context) => string,
    options?: Partial<ConsoleMiddlewareSupplierOptions>,
  ) {
    this.consoleSiteConfig = new ConsoleSiteConfiguration(publication);
    this.htmlEndpointURL = options?.htmlEndpointURL ?? "/console2";
    this.staticIndex = "index.html";
    this.tunnel = options?.tunnel ??
      new ConsoleTunnel(
        `${this.htmlEndpointURL}/sse/ping`,
        `${this.htmlEndpointURL}/sse/tunnel`,
        (userAgentID, ctx) => ({
          userAgentID,
          sseTarget: ctx.oakCtx.sendEvents(),
        }),
        this.serverStateDB,
      );

    router.get(this.tunnel.sseHealthEndpointURL, (ctx) => {
      ctx.response.body =
        `SSE endpoint ${this.tunnel.sseEndpointURL} available`;
      this.tunnel.emit("sseHealthRequest", {
        oakCtx: ctx,
        userAgentIdSupplier: this.userAgentIdSupplier,
      });
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
        this.tunnel.connect({
          oakCtx: ctx,
          userAgentIdSupplier: this.userAgentIdSupplier,
        });
        if (options?.openWindowOnInit) {
          this.tunnel.emit(
            "uaOpenWindow",
            options.openWindowOnInit.url,
            "console-prime",
          );
        }
      } else {
        this.tunnel.emit("sseInvalidRequest", {
          oakCtx: ctx,
          userAgentIdSupplier: this.userAgentIdSupplier,
        });
      }
    });

    [{
      endpoint: `${this.htmlEndpointURL}/proxy/factory`,
      home: () =>
        path.resolve(
          path.fromFileUrl(import.meta.url),
          "../../../../../..",
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
        { staticAssetsHome: this.consoleSiteConfig.destRootPath },
        this.staticEE,
        this.staticIndex,
        (requestUrlPath) =>
          requestUrlPath.substring(this.htmlEndpointURL.length),
        async () => {
          console.log(
            colors.magenta(`Building Console site:`),
            colors.brightBlue(this.consoleSiteConfig.contentRootPath),
            " => ",
            colors.yellow(this.consoleSiteConfig.destRootPath),
          );
          this.#consoleSite = new ConsoleSite(this.consoleSiteConfig);
          await this.#consoleSite.produce();
        },
      ),
    );
  }

  *watchableFileSysPaths(): Generator<wfs.WatchableFileSysPath> {
    const contentRootPathEE = new wfs.WatchableFileSysEventEmitter();
    const relWatchPath = (target: string) =>
      path.relative(this.consoleSiteConfig.contentRootPath, target);
    // deno-lint-ignore require-await
    contentRootPathEE.on("impacted", async ({ path: modified }) => {
      this.tunnel.emit("serverFileImpact", modified);
      // deno-fmt-ignore
      console.info(colors.magenta(`*** ${colors.yellow(relWatchPath(modified))} impacted *** ${colors.gray(`${this.tunnel.connections.length} browser tab refresh requests sent`)}`));
    });
    yield wfs.typicalWatchableFS(
      this.consoleSiteConfig.contentRootPath,
      contentRootPathEE,
    );
  }
}
