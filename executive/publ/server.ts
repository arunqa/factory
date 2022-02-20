import { colors, events, log, path } from "../../core/deps.ts";
import { oak } from "./deps.ts";
import * as rfStd from "../../core/std/mod.ts";
import * as p from "./publication.ts";
import * as wfs from "../../lib/fs/watch.ts";
import * as s from "./static.ts";
import * as c from "./console/mod.ts";
import * as ws from "./workspace.ts";

// export interface PublicationServerContext {
//   readonly iterationCount: number;
//   readonly staticAssetsHome: string;
//   readonly isLiveReloadRequest: boolean;
// }

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
  readonly listenPort: number;
  readonly listenHostname: string;
  readonly publicURL: (path?: string) => string;
  readonly fsEntryPublicationURL?: (
    fsAbsPathAndFileName: string,
  ) => string | undefined;
  readonly staticIndex?: "index.html" | string;
  readonly serverDiagnosticsLogger?: log.Logger;
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

export class PublicationServer {
  readonly staticEE: s.StaticEventEmitter;
  readonly serverEE: PublicationServerEventEmitter;
  readonly listenPort: number;
  readonly listenHostname: string;
  readonly publicURL: (path?: string) => string;
  readonly fsEntryPublicationURL: (
    fsAbsPathAndFileName: string,
  ) => string | undefined;
  readonly staticIndex: "index.html" | string;
  #console?: c.ConsoleMiddlewareSupplier;
  #workspace?: ws.WorkspaceMiddlewareSupplier;

  constructor(
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    options: PublicationServerOptions,
  ) {
    this.serverEE = options.serverEE ??
      new PublicationServerEventEmitter();
    this.staticEE = options.staticEE ??
      new s.StaticEventEmitter();
    this.listenPort = options.listenPort;
    this.listenHostname = options.listenHostname;
    this.publicURL = options.publicURL;
    this.fsEntryPublicationURL = options.fsEntryPublicationURL ??
      ((fsAbsPathAndFileName) => {
        if (
          this.publication.state.resourcesTree instanceof rfStd.TypicalRouteTree
        ) {
          const node = this.publication.state.resourcesTree.fileSysPaths.get(
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
  }

  get console(): c.ConsoleMiddlewareSupplier | undefined {
    return this.#console;
  }

  protected prepareConsole(
    app: oak.Application,
    router: oak.Router,
    staticEE: s.StaticEventEmitter,
    options?: c.ConsoleMiddlewareSupplierOptions,
  ) {
    this.#console = new c.ConsoleMiddlewareSupplier(
      app,
      router,
      staticEE,
      {
        openWindowOnInit: { url: "/" },
        ...options,
      },
    );
    this.staticEE.on("served", async (sae) => {
      // whenever a file is served by the web server, "tell" the console so that
      // it can be available as diagnostics in a web browser
      await this.#console?.staticAccess(sae);
    });
  }

  protected prepareWorkspace(
    app: oak.Application,
    router: oak.Router,
    options?: ws.WorkspaceMiddlewareSupplierOptions,
  ) {
    this.#workspace = new ws.WorkspaceMiddlewareSupplier(
      {
        contentRootPath: this.publication.config.contentRootPath,
        fsEntryPublicationURL: this.fsEntryPublicationURL,
        publicURL: this.publicURL,
      },
      app,
      router,
      options,
    );
    this.staticEE.on("served", async (sae) => {
      // whenever a file is served by the web server, "tell" the console so that
      // it can be available as diagnostics in a web browser
      await this.#console?.staticAccess(sae);
    });
  }

  // deno-lint-ignore require-await
  async persistDiagnostics(diagnostics: unknown) {
    console.error(diagnostics);
  }

  protected server() {
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

    this.prepareConsole(app, router, this.staticEE);
    this.prepareWorkspace(app, router);

    if (this.#console) {
      app.use(async (ctx, next) => {
        await next();
        // set the base URL in the header so that rfExprServerConsoleBaseURL
        // can be set via Javascript (this makes sub pages references easier)
        ctx.response.headers.set(
          "RF-Console-HTML-Base-URL",
          this.#console!.htmlEndpointURL,
        );
      });
    }

    app.addEventListener("error", (evt) => {
      // don't show errors which don't have a message
      if (!evt.message || evt.message.trim().length == 0) return;

      // if the errors is a transient networking issue, ignore it
      if (evt.message == "connection closed before message completed") return;

      console.error(
        colors.red(`*** Oak error *** [${colors.yellow(evt.message)}]`),
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
        await this.persistDiagnostics({
          oakAppCtx: ctx,
          nature: "oak-app-error-mw",
          error,
        });
      }
    });

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
    if (this.#console) {
      yield* this.#console.watchableFileSysPaths();
    }
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
    const server = this.server();
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
        watchFSs.forEach(async (wfs) => await wfs.trigger(event, watcher));
      }
      this.serverEE.emitSync("afterListen", this);

      if (server.lifecycleMgr.isShutdownRequested()) {
        return;
      }
    }
  }
}
