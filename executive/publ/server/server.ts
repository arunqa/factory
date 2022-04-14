import { colors, events, path } from "../../../core/deps.ts";
import { async, oak } from "./deps.ts";
import * as rfStd from "../../../core/std/mod.ts";
import * as p from "../publication.ts";
import * as wfs from "../../../lib/fs/watch.ts";
import * as bjs from "../../../lib/package/bundle-js.ts";
import * as s from "./middleware/static.ts";
import * as ws from "./middleware/workspace/mod.ts";
import * as assure from "./middleware/assurance.ts";
import * as pDB from "../publication-db.ts";
import * as sqlP from "./middleware/server-runtime-sql-proxy.ts";
import * as srJsTsProxy from "./middleware/server-runtime-script-proxy.ts";
import * as rJSON from "../../../core/content/routes.json.ts";

export interface PublicationServerAccessContext
  extends p.PublicationOperationalContext {
  // deno-lint-ignore no-explicit-any
  readonly oakCtx: oak.Context<any>;
}

export class PublicationServerEventEmitter extends events.EventEmitter<{
  beforeListen(ps: PublicationServer): void;
  afterListen(ps: PublicationServer): void;
  restartRequested(lm: PublicationServerLifecyleManager): void;
  resetRestartRequest(lm: PublicationServerLifecyleManager): void;
  shutdownRequested(lm: PublicationServerLifecyleManager): void;
  persistDiagnostics(diagnostics: unknown): Promise<void>;
}> {}

export interface PublicationServerOptions {
  readonly staticEE?: s.StaticEventEmitter;
  readonly serverEE?: PublicationServerEventEmitter;
  readonly tsTransformEE?: bjs.TransformTypescriptEventEmitter;
  readonly listenPort: number;
  readonly listenHostname: string;
  readonly publicURL: (path?: string) => string;
  readonly fsEntryPublicationURL?: (
    fsAbsPathAndFileName: string,
  ) => string | undefined;
  readonly staticIndex?: "index.html" | string;
  readonly serverStateDB?: pDB.PublicationDatabase;
}

export class PublicationServerLifecyleManager {
  #shutdownRequested = false;
  #restartRequested = false;

  constructor(
    readonly abortController: AbortController,
    readonly ee: PublicationServerEventEmitter,
  ) {
  }

  requestRestart(reason?: string) {
    this.#restartRequested = true;
    this.abortController.abort(reason);
    this.ee.emitSync("restartRequested", this);
    console.info(colors.brightMagenta("server restart requested"));
  }

  resetRestartRequest() {
    this.#restartRequested = false;
    this.ee.emitSync("resetRestartRequest", this);
    console.info(
      colors.brightMagenta(
        `server restart request: ${this.#restartRequested}`,
      ),
    );
  }

  isRestartRequested() {
    return this.#restartRequested;
  }

  requestShutdown(reason?: string) {
    this.#shutdownRequested = true;
    this.abortController.abort(reason);
    this.ee.emitSync("shutdownRequested", this);
    console.info(colors.brightMagenta("server shutdown requested"));
  }

  isShutdownRequested() {
    return this.#shutdownRequested;
  }
}

export const registerTransformTypescriptToCacheableJsRoute = (
  router: oak.Router,
  endpointWithoutExtn: string,
  tsSrcRootSpecifier: string,
  tsJsCache: Map<string, bjs.CacheableTypescriptSource>,
) => {
  router.get(
    // see https://github.com/pillarjs/path-to-regexp for RegExp rules
    `${endpointWithoutExtn}(\.min\.mjs|\.mjs|\.min\.ts|\.ts)`,
    async (ctx) => {
      const cached = await bjs.transformTypescriptToCacheableJS(
        tsJsCache,
        {
          tsSrcRootSpecifier,
          tsEmitBundle: "module",
        },
        {
          minify: ctx.request.url.pathname.indexOf(".min.") != -1,
          cacheKey: ctx.request.url.pathname,
        },
      );
      ctx.response.headers.set("Content-Type", "text/javascript");
      ctx.response.body = cached?.javaScript ??
        `// unable to transform ${tsSrcRootSpecifier} to Javascript`;
    },
  );
};

export class PublicationServer {
  readonly staticEE: s.StaticEventEmitter;
  readonly serverEE: PublicationServerEventEmitter;
  readonly tsTransformEE: bjs.TransformTypescriptEventEmitter;
  readonly listenPort: number;
  readonly listenHostname: string;
  readonly publicURL: (path?: string) => string;
  readonly fsEntryPublicationURL: (
    fsAbsPathAndFileName: string,
  ) => string | undefined;
  readonly staticIndex: "index.html" | string;
  readonly serverStateDB?: pDB.PublicationDatabase;
  readonly userAgentIdSupplier = (ctx: oak.Context) => {
    // for now assume there's only one Console per server so the userAgent ID
    // is just the caller's URL (which should be unique enough). TODO: add
    // cookie or other authentication / identity support when multiple users
    // will be found.
    return ctx.request.url.toString();
  };
  readonly tsJsCache = new Map<string, bjs.CacheableTypescriptSource>();
  #workspace?: ws.WorkspaceMiddlewareSupplier;

  constructor(
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    options: PublicationServerOptions,
  ) {
    this.serverEE = options.serverEE ??
      new PublicationServerEventEmitter();
    this.staticEE = options.staticEE ??
      new s.StaticEventEmitter();
    this.tsTransformEE = options.tsTransformEE ??
      new bjs.TransformTypescriptEventEmitter();
    this.listenPort = options.listenPort;
    this.listenHostname = options.listenHostname;
    this.serverStateDB = options.serverStateDB;
    this.publicURL = options.publicURL;
    this.fsEntryPublicationURL = options.fsEntryPublicationURL ??
      ((fsAbsPathAndFileName) => {
        if (
          this.publication.routes.resourcesTree instanceof
            rfStd.TypicalRouteTree
        ) {
          const node = this.publication.routes.resourcesTree.fileSysPaths.get(
            fsAbsPathAndFileName,
          );
          if (node) {
            return node.location();
          }
        } else {
          console.warn(
            "publication.state.resourcesTree is not instanceof rfStd.TypicalRouteTree",
          );
          return undefined;
        }
      });
    this.staticIndex = options.staticIndex ?? "index.html";
    this.staticEE.on("transform", async (ssoe) => {
      // if we're about to serve a *.js file (e.g. XYZ.js or XYZ.auto.js) see
      // if it has a *.ts "twin" which we bundle for the browser. This is the
      // same as Taskfile.ts's bundleJsFromTsTwinTask(), which is run as part
      // of the build process. This "transform" handler just does it
      // automatically, which is useful during development for hot-reloading.
      if (ssoe.target.endsWith(".js")) {
        await bjs.bundleJsFromTsTwinIfNewer(
          bjs.jsPotentialTsTwin(
            bjs.typicalJsNamingStrategy(path.join(ssoe.root, ssoe.target)),
          ),
          this.tsTransformEE,
        );
      }
    });
    // deno-lint-ignore require-await
    this.staticEE.on("served", async (ssoe) => {
      if (ssoe.target && this.serverStateDB) {
        this.serverStateDB.persistStaticServed(ssoe.target);
      }
    });
  }

  get workspace(): ws.WorkspaceMiddlewareSupplier | undefined {
    return this.#workspace;
  }

  protected prepareWorkspace(
    app: oak.Application,
    router: oak.Router,
    staticEE: s.StaticEventEmitter,
    options?: ws.WorkspaceMiddlewareSupplierOptions,
  ) {
    this.#workspace = new ws.WorkspaceMiddlewareSupplier(
      {
        contentRootPath: this.publication.config.contentRootPath,
        fsEntryPublicationURL: this.fsEntryPublicationURL,
        publicURL: this.publicURL,
        wsEditorResolver: this.publication.ds.contentStrategy.wsEditorResolver,
        userAgentIdSupplier: this.userAgentIdSupplier,
      },
      app,
      router,
      staticEE,
      options,
    );
  }

  protected prepareAssurance(
    app: oak.Application,
    router: oak.Router,
    options?: assure.AssuranceMiddlewareSupplier,
  ) {
    new assure.AssuranceMiddlewareSupplier(
      {
        contentRootPath: this.publication.config.contentRootPath,
        fsEntryPublicationURL: this.fsEntryPublicationURL,
        publicURL: this.publicURL,
        userAgentIdSupplier: this.userAgentIdSupplier,
      },
      app,
      router,
      options,
    );
  }

  protected prepareRuntimeSqlProxy(
    app: oak.Application,
    router: oak.Router,
  ) {
    new sqlP.ServerRuntimeSqlProxyMiddlewareSupplier(
      app,
      router,
      this.publication,
      this.serverStateDB,
      "/SQL",
    );
  }

  protected prepareRuntimeJsTsProxy(
    app: oak.Application,
    router: oak.Router,
  ) {
    new srJsTsProxy
      .ServerRuntimeJsTsProxyMiddlewareSupplier(
      app,
      router,
      {
        serializedJSON: rJSON.typicalSerializedJSON,
      },
      {
        isRuntimeExposureContext: true,
        publication: this.publication,
        publicationDB: this.serverStateDB,
        globalSqlDbConns: window.globalSqlDbConns ?? new Map(),
      },
      "/unsafe-server-runtime-proxy",
    );
  }

  protected prepareUserAgentScripts(router: oak.Router) {
    // the right hand value must return governance.ServerUserAgentContext object
    const scriptRightHandValue = () => {
      const publFsEntryResolver =
        this.publication.config.operationalCtx.projectRootPath;
      const factoryFsEntryHome = path.resolve(
        path.fromFileUrl(import.meta.url),
        "../../../..",
      );

      // we have to resolve the names fully because these will be served to JS;
      // we cannot pass in functions to JS because the context of server is
      // different from the user-agent context; .slice(0, -1) chops last /
      const publRelativeHome = publFsEntryResolver("/").slice(0, -1);
      const publAbsHome = publFsEntryResolver("/", true).slice(0, -1);
      return `{
        project: {
          publFsEntryPath: (relative, abs) => {
            return abs ? \`${publAbsHome}\${relative}\` : \`${publRelativeHome}\${relative}\` ;
          },
          factoryFsEntryPath: (relative, abs) => {
            return abs ? \`${factoryFsEntryHome}\${relative}\` : \`${
        path.relative(publAbsHome, factoryFsEntryHome)
      }\${relative}\` ;
          },
        },
      }`;
    };

    router.get(`/server-ua-context.mjs`, (ctx) => {
      ctx.response.headers.set("Content-Type", "text/javascript");
      ctx.response.body =
        `export default /* serverContext: governance.ServerUserAgentContext */ ${scriptRightHandValue()}`;
    });

    // see https://github.com/pillarjs/path-to-regexp for RegExp
    router.get("/server-ua-context.([c]?)js", (ctx) => {
      ctx.response.headers.set("Content-Type", "text/javascript");
      ctx.response.body = `var publServerContext = ${scriptRightHandValue()}`;
    });
  }

  async persistDiagnostics(
    locationHref: string,
    errorSummary: string,
    diagnostics: unknown,
  ) {
    const stored = await this.serverStateDB?.persistServerError({
      locationHref,
      errorSummary,
      errorElaboration: JSON.stringify(diagnostics),
    });
    console.error(
      `${colors.red(`error at ${colors.magenta(locationHref)}`)} ${
        colors.dim(
          `stored in ${
            this.publication.config.operationalCtx.publStateDbLocation(true)
          } table ${stored?.tableName} ID ${stored?.logged
            ?.publServerErrorLogId}`,
        )
      }`,
    );
  }

  // deno-lint-ignore require-await
  protected async server() {
    const app = new oak.Application({
      serverConstructor: oak.HttpServerNative,
      logErrors: false,
    });
    const router = new oak.Router();
    const abortController = new AbortController();
    const lifecycleMgr = new PublicationServerLifecyleManager(
      abortController,
      this.serverEE,
    );

    this.prepareRuntimeJsTsProxy(app, router);
    this.prepareWorkspace(app, router, this.staticEE);
    this.prepareAssurance(app, router);
    this.prepareRuntimeSqlProxy(app, router);
    this.prepareUserAgentScripts(router);

    app.addEventListener("error", (event) => {
      // don't show errors which don't have a message
      if (!event.message || event.message.trim().length == 0) return;

      // if the errors is a transient networking issue, ignore it
      if (event.message == "connection closed before message completed") return;

      this.persistDiagnostics(
        "Oak ApplicationErrorEventListener",
        event.message,
        {
          oakEvent: event,
          nature: "oak-app-error",
          event,
        },
      );
    });

    // debug Logger, usually turned off except for developers' testing
    // app.use(async (ctx, next) => {
    //   await next();
    //   console.log(
    //     `${ctx.request.method} ${
    //       colors.brightCyan(ctx.request.url.toString())
    //     }`,
    //   );
    // });

    // error handler middleware
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        await this.persistDiagnostics(
          ctx.request.url.pathname,
          error.toString(),
          {
            oakAppCtx: ctx,
            nature: "oak-app-error-mw",
            error,
          },
        );
      }
    });

    // custom route to force and error so we can test the diagnostics storage
    router.get("/error", (_ctx) => {
      throw new Error("an error has been thrown");
    });

    app.use(router.routes());
    app.use(router.allowedMethods());
    app.use(
      s.staticContentMiddleware(
        { staticAssetsHome: this.publication.config.destRootPath },
        this.staticEE,
        this.staticIndex,
      ),
    );

    // page not found
    // deno-lint-ignore require-await
    app.use(async (ctx) => {
      ctx.response.status = oak.Status.NotFound;
      ctx.response.body = `"${ctx.request.url}" not found`;
    });

    return {
      app,
      router,
      lifecycleMgr,
    };
  }

  protected *watchableFileSysPaths(): Generator<wfs.WatchableFileSysPath> {
    if (this.#workspace) {
      yield* this.#workspace.watchableFileSysPaths();
    }
  }

  // deno-lint-ignore require-await
  protected async fileWatchers(
    serverEE: PublicationServerEventEmitter,
  ): Promise<
    [wfs.WatchableFileSysPath[], Deno.FsWatcher]
  > {
    const watchFSsMap = new Map<string, wfs.WatchableFileSysPath>();
    for (const wfsp of this.watchableFileSysPaths()) {
      const found = watchFSsMap.get(wfsp.path);
      if (found) {
        console.warn(`skipping duplicate WatchableFileSys ${wfsp.path}`);
      } else {
        watchFSsMap.set(wfsp.path, wfsp);
      }
    }
    const watchFSs = Array.from(watchFSsMap.values());
    const result = Deno.watchFs(
      Array.from(watchFSs.values()).map((w) => w.path),
      {
        recursive: true,
      },
    );
    const endWatchFSs = () => result.close();
    serverEE.on("restartRequested", endWatchFSs);
    serverEE.on("shutdownRequested", endWatchFSs);
    const relWatchPath = (target: string) => path.relative(Deno.cwd(), target);
    for (const w of watchFSs) {
      console.info(`   Watching: ${colors.yellow(relWatchPath(w.path))}`);
    }
    return [watchFSs, result];
  }

  async serve() {
    const server = await this.server();
    let listener: Promise<void> | undefined = undefined;

    const listen = async () => {
      if (server.lifecycleMgr.isRestartRequested() && listener) {
        // finish up any existing transactions
        await listener;
        server.lifecycleMgr.resetRestartRequest();
      }

      this.serverEE.emitSync("beforeListen", this);
      listener = server.app.listen({
        port: this.listenPort,
        hostname: this.listenHostname,
        signal: server.lifecycleMgr.abortController.signal,
      });
    };

    addEventListener("unload", async () => {
      console.info(
        colors.brightBlue("[cleanup] checking if server is listening"),
      );
      if (listener) {
        console.info(
          colors.brightBlue("[cleanup] closing serverListener on unload"),
        );
        server.lifecycleMgr.abortController.abort("window.unload");
        // finish up any remaining transactions
        await listener;
        this.serverEE.emitSync("afterListen", this);
        console.info(
          colors.brightBlue("[cleanup] serverListener has finished"),
        );
      }
    });

    while (true) {
      listen();

      const [watchFSs, watcher] = await this.fileWatchers(this.serverEE);
      for await (const event of watcher) {
        const debounce = async.debounce((event: Deno.FsEvent) => {
          watchFSs.forEach(async (wfs) => await wfs.trigger(event, watcher));
        }, 200);
        debounce(event);
      }
      this.serverEE.emitSync("afterListen", this);

      if (server.lifecycleMgr.isShutdownRequested()) {
        return;
      }
    }
  }
}
