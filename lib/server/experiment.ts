import { colors, oak, oakApp, path } from "./deps.ts";
import * as sc from "../socket/server/command.ts";

export class ErrorBrowserCommand implements
  sc.SocketCommand<
    unknown,
    void,
    sc.SocketCommandsConfiguration,
    sc.ProvisionableSocketState
  > {
  static readonly instance = new ErrorBrowserCommand();
  readonly identity = "error";

  // deno-lint-ignore require-await
  async execute(
    cm: sc.SocketCommandsManager<
      sc.SocketCommandsConfiguration,
      sc.ProvisionableSocketState
    >,
    args: unknown,
  ) {
    cm.state.sendCommand(this, args);
  }
}

export class LogBrowserCommand implements
  sc.SocketCommand<
    unknown,
    void,
    sc.SocketCommandsConfiguration,
    sc.ProvisionableSocketState
  > {
  static readonly instance = new LogBrowserCommand();
  readonly identity = "log";

  // deno-lint-ignore require-await
  async execute(
    cm: sc.SocketCommandsManager<
      sc.SocketCommandsConfiguration,
      sc.ProvisionableSocketState
    >,
    args: unknown,
  ) {
    cm.state.sendCommand(this, args);
  }
}

export class ReloadBrowserCommand implements
  sc.SocketCommand<
    void,
    void,
    sc.SocketCommandsConfiguration,
    sc.ProvisionableSocketState
  > {
  static readonly instance = new ReloadBrowserCommand();
  readonly identity = "reload";

  // deno-lint-ignore require-await
  async execute(
    cm: sc.SocketCommandsManager<
      sc.SocketCommandsConfiguration,
      sc.ProvisionableSocketState
    >,
  ) {
    cm.state.sendCommand(this, {});
  }
}

export interface LogAccessBrowserCommandArgs {
  readonly status: number;
  readonly locationHref: string;
  readonly extn: string;
  readonly fsTarget: string;
  readonly fsTargetSymLink?: string;
}

export class LogAccessBrowserCommand implements
  sc.SocketCommand<
    LogAccessBrowserCommandArgs,
    void,
    sc.SocketCommandsConfiguration,
    sc.ProvisionableSocketState
  > {
  static readonly instance = new LogAccessBrowserCommand();
  readonly identity = "log-access";

  // deno-lint-ignore require-await
  async execute(
    cm: sc.SocketCommandsManager<
      sc.SocketCommandsConfiguration,
      sc.ProvisionableSocketState
    >,
    args: LogAccessBrowserCommandArgs,
  ) {
    cm.state.sendCommand(this, args);
  }
}

export class ClientDiagsSocketsCmdManager
  extends sc.TypicalSocketCommandsManager<
    sc.SocketCommandsConfiguration,
    sc.ProvisionableSocketState
  > {
  readonly ephemeralHtmlEndpointURL: string;
  readonly ephemeralWsEndpointURL: string;

  constructor(config: sc.SocketCommandsConfiguration) {
    super(config);
    this.ephemeralHtmlEndpointURL = `${config.endpointBaseURL}/ephemeral/`;
    this.ephemeralWsEndpointURL = `${this.ephemeralHtmlEndpointURL}ws`;
    this.register(ErrorBrowserCommand.instance);
    this.register(LogBrowserCommand.instance);
    this.register(ReloadBrowserCommand.instance);
    this.register(LogAccessBrowserCommand.instance);
  }
}

export interface LiveReloadClientState {
  readonly endpointURL: string;
  readonly lrSockets: WebSocket[];
  readonly register: (socket: WebSocket) => void;
  readonly cleanup: () => void;
}

export function typicalLiveReloadClientState(
  { endpointURL }: Pick<LiveReloadClientState, "endpointURL">,
): LiveReloadClientState {
  const lrSockets: WebSocket[] = [];
  return {
    endpointURL,
    lrSockets,
    register: (socket) => {
      socket.onopen = () => lrSockets.push(socket);
      socket.onclose = () => {
        const index = lrSockets.indexOf(socket);
        if (index !== -1) {
          lrSockets.splice(index, 1);
        }
      };
      socket.onerror = (e) => console.error("live reload socket errored", e);
    },
    cleanup: () => {
      for (const lrSocket of lrSockets) {
        // when the socket is closed, it will force reload on the client because
        // the websocket closed signal is what is monitored
        lrSocket.close(-1, "reload");
        console.log("closed live reload, reload request sent to browser");
      }
    },
  };
}

export interface LiveReloadServerState {
  readonly clientState: LiveReloadClientState;
  readonly watchFS: string | string[];
  readonly onFileSysEvent: (
    event: Deno.FsEvent,
    watcher: Deno.FsWatcher,
  ) => Promise<void>;
  readonly onFileSysWatcherEvent?: (stage: "start") => Promise<void>;
}

export function typicalLiveReloadServerState(
  { watchFS, onFileSysEvent, clientState, onFileSysWatcherEvent }: Pick<
    LiveReloadServerState,
    "watchFS" | "onFileSysEvent" | "clientState" | "onFileSysWatcherEvent"
  >,
): LiveReloadServerState {
  return {
    watchFS,
    onFileSysEvent,
    clientState,
    onFileSysWatcherEvent,
  };
}

export interface ExperimentalServerOperationalContext {
  readonly iterationCount: number;
  readonly staticAssetsHome: string;
  readonly isLiveReloadRequest: boolean;
}

export interface StaticAccessEvent {
  // deno-lint-ignore no-explicit-any
  readonly oakCtx: oak.Context<any>;
  readonly oc: ExperimentalServerOperationalContext;
  readonly serveStartedMark: PerformanceMark;
  readonly target?: string;
}

export type StaticAccessEventHandler = (
  event: StaticAccessEvent,
) => Promise<void>;

export interface StaticAccessErrorEvent {
  // deno-lint-ignore no-explicit-any
  readonly oakCtx: oak.Context<any>;
  readonly oc: ExperimentalServerOperationalContext;
  readonly error: Error;
}

export type StaticAccessErrorEventHandler = (
  event: StaticAccessErrorEvent,
) => Promise<void>;

export interface ExperimentalServerOptions
  extends ExperimentalServerOperationalContext {
  readonly staticIndex: "index.html" | string;
  // deno-lint-ignore no-explicit-any
  readonly onBeforeStaticServe?: (oakCtx: oak.Context<any>) => Promise<void>;
  readonly onServerListen?: (
    event: oakApp.ApplicationListenEvent,
  ) => Promise<void>;
  readonly onServedStatic?: StaticAccessEventHandler;
  readonly onStaticServeError?: StaticAccessErrorEventHandler;
  readonly clientDiagostics: ClientDiagsSocketsCmdManager;
  readonly liveReloadClientState?: LiveReloadClientState;
  readonly diagnosticsPersistDest: string;
}

export function staticAccessClientDiagsEmitter(
  clientDiags: ClientDiagsSocketsCmdManager,
  showFilesRelativeTo: string,
): StaticAccessEventHandler {
  return async (event) => {
    const { target, oakCtx } = event;
    if (target) {
      const followedSymLink = await Deno.realPath(target);
      const accessToSendToClient = {
        status: oakCtx.response.status,
        locationHref: oakCtx.request.url.pathname,
        extn: path.extname(target),
        fsTarget: path.relative(showFilesRelativeTo, target),
        fsTargetSymLink: target != followedSymLink
          ? path.relative(showFilesRelativeTo, followedSymLink)
          : undefined,
      };
      LogAccessBrowserCommand.instance.execute(
        clientDiags,
        accessToSendToClient,
      );
    } else {
      // deno-fmt-ignore
      ErrorBrowserCommand.instance.execute(clientDiags, `console.error("'${colors.brightRed(oakCtx.request.url.pathname)}' was not served")`);
    }
  };
}

export function staticAccessErrorConsoleEmitter(
  clientDiags: ClientDiagsSocketsCmdManager,
): StaticAccessErrorEventHandler {
  // deno-lint-ignore require-await
  return async (event) => {
    // deno-fmt-ignore
    ErrorBrowserCommand.instance.execute(clientDiags, `console.error("'${colors.brightRed(event.oakCtx.request.url.pathname)}' error:", ${JSON.stringify(event.error)})`);
  };
}

export const experimentalServer = (options: ExperimentalServerOptions) => {
  const exprServerContentPath = path.dirname(import.meta.url).substr(
    "file://".length,
  );
  const app = new oak.Application({
    serverConstructor: oak.HttpServerNative,
  });
  const router = new oak.Router();
  const {
    staticAssetsHome,
    staticIndex,
    liveReloadClientState,
    clientDiagostics,
    diagnosticsPersistDest,
  } = options;
  let { onServedStatic } = options;
  const onStaticServeError = options?.onStaticServeError ||
    staticAccessErrorConsoleEmitter(clientDiagostics);

  const persistDiagnostics = async (
    diagnostics: unknown,
    options?: { key?: string },
  ) => {
    const output = {
      at: new Date(),
      [options?.key ?? "diagnostics"]: diagnostics,
    };
    Deno.writeTextFileSync(
      diagnosticsPersistDest,
      JSON.stringify(output) + "\n",
      { append: true },
    );
    await LogBrowserCommand.instance.execute(clientDiagostics, output);
    console.error(
      colors.red(
        `*** internal issue encountered, persisted diagnostics in ${
          colors.yellow(diagnosticsPersistDest)
        }`,
      ),
    );
  };

  // error handler middleware
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      persistDiagnostics({
        oakAppCtx: ctx,
        nature: "oak-app-error-mw",
        error,
      });
    }
  });

  app.addEventListener("error", (event) => {
    persistDiagnostics({
      nature: "oak-app-error",
      event,
    });
  });

  // explcit routes defined here, anything not defined will be statically served
  router.get("/index.html", (ctx) => {
    ctx.response.body = "SSR test route in experimentalServer (don't use this)";
  });

  router.get(clientDiagostics.ephemeralHtmlEndpointURL, async (ctx) => {
    ctx.response.body = await Deno.readTextFile(
      path.join(exprServerContentPath, "ephemeral-diagnostics.html"),
    );
  });

  // ephemeral-access-log.html will create a websocket back to this endpoint
  router.get(clientDiagostics.ephemeralWsEndpointURL, (ctx) => {
    const socket = ctx.upgrade();
    clientDiagostics.state.register({
      socket,
      configure: (handlers) => {
        socket.onopen = handlers.onopen;
        socket.onclose = handlers.onclose;
        socket.onerror = handlers.onerror;
        socket.onmessage = handlers.onmessage;
      },
      send: (data) => socket.send(data),
      // deno-lint-ignore require-await
      cleanup: async () => socket.close(1, "cleanup"),
    }, (payload, state) => {
      state.provisioned = payload;
      LogBrowserCommand.instance.execute(
        clientDiagostics,
        JSON.stringify(payload),
      );
    });
    onServedStatic = staticAccessClientDiagsEmitter(
      clientDiagostics,
      options.staticAssetsHome,
    );
  });

  if (liveReloadClientState) {
    // create the live-reload websocket endpoint; whenever the listener is
    // restarted, the websocket will die on the client which will trigger a reload
    // of the browser's web page; the actual websocket message is irrelevant
    router.get(liveReloadClientState.endpointURL, (ctx) => {
      liveReloadClientState.register(ctx.upgrade());
      LogBrowserCommand.instance.execute(clientDiagostics, {
        identity: "logLiveReloadRequest",
        endpointURL: liveReloadClientState.endpointURL,
        originPathName: ctx.request.url.searchParams.get("origin-pathname"),
      });
    });
  }

  router.get("/error", (_ctx) => {
    throw new Error("an error has been thrown");
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  // static content
  app.use(async (ctx, next) => {
    try {
      if (options?.onBeforeStaticServe) {
        await options.onBeforeStaticServe(ctx);
      }
      if (onServedStatic) {
        const serveStartedMark = performance.mark(ctx.request.url.pathname);
        const target = await ctx.send({
          root: staticAssetsHome,
          index: staticIndex,
        });
        await onServedStatic({
          target,
          oakCtx: ctx,
          serveStartedMark,
          oc: options,
        });
      } else {
        await ctx.send({ root: staticAssetsHome, index: staticIndex });
      }
    } catch (err) {
      if (onStaticServeError) {
        onStaticServeError({ oakCtx: ctx, oc: options, error: err });
      }
      next();
    }
  });

  // page not found
  // deno-lint-ignore require-await
  app.use(async (ctx) => {
    ctx.response.status = oak.Status.NotFound;
    ctx.response.body = `"${ctx.request.url}" not found`;
  });

  if (options.onServerListen) {
    app.addEventListener("listen", options.onServerListen);
  }

  return app;
};

export async function experimentalServerListen(
  eso: ExperimentalServerOptions,
  lrss?: LiveReloadServerState,
  port = 8003,
) {
  const app = experimentalServer(eso);
  if (lrss) {
    app.listen({ port });

    const watcher = Deno.watchFs(lrss.watchFS, {
      recursive: true,
    });
    if (lrss.onFileSysWatcherEvent) lrss.onFileSysWatcherEvent("start");
    for await (const event of watcher) {
      lrss.onFileSysEvent(event, watcher);
    }
  } else {
    await app.listen({ port });
  }
}
