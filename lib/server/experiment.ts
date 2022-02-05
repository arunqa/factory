import { colors, oak, oakApp, path } from "./deps.ts";

export interface LiveReloadState {
  readonly endpointURL: string;
  readonly lrSockets: WebSocket[];
  readonly register: (socket: WebSocket) => void;
  readonly cleanup: () => void;
}

export function typicalLiveReloadState(endpointURL: string): LiveReloadState {
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
      socket.onerror = (e) => console.error("Socket errored", e);
    },
    cleanup: () => {
      for (const lrSocket of lrSockets) {
        // when the socket is closed, it will force reload on the client because
        // the websocket closed signal is what is monitored
        lrSocket.close(-1, "reload");
        console.log("closed lrSocket, reload request sent to browser");
      }
    },
  };
}

export interface ExperimentalServerOperationalContext {
  readonly processStartTimestamp: Date;
  readonly iterationCount: number;
  readonly isReloadRequest: boolean;
  readonly staticAssetsHome: string;
  readonly liveReloadState?: LiveReloadState;
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
  readonly onServerListen?: (
    event: oakApp.ApplicationListenEvent,
  ) => Promise<void>;
  readonly onServedStatic?: StaticAccessEventHandler;
  readonly onStaticServeError?: StaticAccessErrorEventHandler;
}

export function staticAccessColoredConsoleEmitter(
  showFilesRelativeTo: string,
): StaticAccessEventHandler {
  const accessLog: Record<string, { color: (text: string) => string }> = {
    ".html": { color: colors.green },
    ".png": { color: colors.cyan },
    ".drawio.png": { color: colors.green },
    ".jpg": { color: colors.cyan },
    ".gif": { color: colors.cyan },
    ".ico": { color: colors.cyan },
    ".svg": { color: colors.cyan },
    ".drawio.svg": { color: colors.green },
    ".css": { color: colors.magenta },
    ".js": { color: colors.yellow },
    ".json": { color: colors.white },
    ".pdf": { color: colors.green },
  };

  return async (event) => {
    const { target, oakCtx } = event;
    if (target) {
      const relative = path.relative(showFilesRelativeTo, target);
      const extn = path.extname(target);
      const al = accessLog[extn];
      const status = oakCtx.response.status;
      if (status == oak.Status.NotModified) {
        al.color = colors.gray;
      }
      const followedSymLink = await Deno.realPath(target);
      let symlink = "";
      if (target != followedSymLink) {
        const relativeSymlink = " -> " +
          path.relative(showFilesRelativeTo, followedSymLink);
        symlink = al ? al.color(relativeSymlink) : colors.gray(relativeSymlink);
      }
      console.info(
        status == oak.Status.OK
          ? colors.brightGreen(status.toString())
          : colors.gray(status.toString()),
        `${al ? al.color(relative) : colors.gray(relative)}${symlink}`,
      );
    } else {
      // deno-fmt-ignore
      console.error(colors.red(`oak ctx.send('${colors.brightRed(oakCtx.request.url.pathname)}') was not served`));
    }
  };
}

export function staticAccessErrorConsoleEmitter(): StaticAccessErrorEventHandler {
  // deno-lint-ignore require-await
  return async (event) => {
    // deno-fmt-ignore
    console.error(colors.red(`oak ctx.send('${colors.brightRed(event.oakCtx.request.url.pathname)}') error: ${event.error}`));
  };
}

export const experimentalServer = (options: ExperimentalServerOptions) => {
  const app = new oak.Application({
    serverConstructor: oak.HttpServerNative,
  });
  const router = new oak.Router();
  const { staticAssetsHome, staticIndex, liveReloadState, onServedStatic } =
    options;

  // error handler
  app.use(async (_ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.error(err);
    }
  });

  // explcit routes defined here, anything not defined will be statically served
  router.get("/index.html", (ctx) => {
    ctx.response.body = "SSR test route in experimentalServer (don't use this)";
  });

  if (liveReloadState) {
    // create the live-reload websocket endpoint; whenever the listener is
    // restarted, the websocket will die on the client which will trigger a reload
    // of the browser's web page; the actual websocket message is irrelevant
    router.get(liveReloadState.endpointURL, (ctx) => {
      liveReloadState.register(ctx.upgrade());
      console.log(
        colors.gray(
          // accept-encoding,accept-language,cache-control,connection,host,origin,pragma,sec-websocket-extensions,sec-websocket-key,sec-websocket-version,upgrade,user-agent
          `    ${liveReloadState.endpointURL} hook request from ${
            ctx.request.url.searchParams.get("origin-pathname")
          }`,
        ),
      );
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
      if (options.onStaticServeError) {
        options.onStaticServeError({ oakCtx: ctx, oc: options, error: err });
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
  port = 8003,
) {
  const app = experimentalServer(eso);
  await app.listen({ port });
}
