import { colors, oak, oakUtil, path } from "./deps.ts";
import * as human from "../text/human.ts";

export interface StaticAccessEvent {
  // deno-lint-ignore no-explicit-any
  readonly oakCtx: oak.Context<any>;
  readonly staticRoot: string;
  readonly candidate?: [string, Deno.FileInfo];
}

export interface ExperimentalServerOperationalContext {
  readonly processStartTimestamp: Date;
  readonly iterationCount: number;
  readonly watching: string | string[];
  readonly isReloadRequest: boolean;
  readonly triggerEvent?: Deno.FsEvent;
  readonly liveReloadSockets: WebSocket[];
}

export interface ExperimentalServerOptions
  extends ExperimentalServerOperationalContext {
  readonly beforeStaticAccess?: (event: StaticAccessEvent) => Promise<void>;
}

export const experimentalServer = (options?: ExperimentalServerOptions) => {
  const app = new oak.Application({
    serverConstructor: oak.HttpServerNative,
  });
  const router = new oak.Router();

  // error handler
  app.use(async (_ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.log(err);
    }
  });

  // explcit routes defined here, anything not defined will be statically served
  router.get("/index.html", (ctx) => {
    ctx.response.body = "SSR test route in experimentalServer (don't use this)";
  });

  if (options?.liveReloadSockets) {
    const lrSockets = options?.liveReloadSockets;
    // create the live-reload websocket endpoint; whenever the listener is
    // restarted, the websocket will die on the client which will trigger a reload
    // of the browser's web page; the actual websocket message is irrelevant
    router.get("/ws/experiment/live-reload", async (ctx) => {
      const socket = await ctx.upgrade();
      socket.onopen = () => lrSockets.push(socket);
      socket.onclose = () => {
        const index = lrSockets.indexOf(socket);
        if (index !== -1) {
          lrSockets.splice(index, 1);
        }
      };
      socket.onerror = (e) => console.log("Socket errored", e);
      console.log(colors.gray(`    /ws/experiment/live-reload hook request`));
    });
  }

  router.get("/error", (_ctx) => {
    throw new Error("an error has been thrown");
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  // static content
  const staticRoot = `${Deno.cwd()}/public`;
  const showFilesRelativeTo = Deno.cwd();
  app.use(async (ctx, next) => {
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
    try {
      if (options?.beforeStaticAccess) {
        const candidate = await willSendStatic(ctx, staticRoot, "index.html");
        options.beforeStaticAccess({ oakCtx: ctx, staticRoot, candidate });
      }
      const target = await ctx.send({ root: staticRoot, index: "index.html" });
      if (target) {
        const relative = path.relative(showFilesRelativeTo, target);
        const extn = path.extname(target);
        const al = accessLog[extn];
        const status = ctx.response.status;
        if (status == oak.Status.NotModified) {
          al.color = colors.gray;
        }
        const followedSymLink = await Deno.realPath(target);
        let symlink = "";
        if (target != followedSymLink) {
          const relativeSymlink = " -> " +
            path.relative(showFilesRelativeTo, followedSymLink);
          symlink = al
            ? al.color(relativeSymlink)
            : colors.gray(relativeSymlink);
        }
        console.info(
          status == oak.Status.OK
            ? colors.brightGreen(status.toString())
            : colors.gray(status.toString()),
          `${al ? al.color(relative) : colors.gray(relative)}${symlink}`,
        );
      } else {
        // deno-fmt-ignore
        console.error(colors.red(`oak ctx.send('${colors.brightRed(ctx.request.url.pathname)}') was not served`));
      }
    } catch {
      next();
    }
  });

  // page not found
  // deno-lint-ignore require-await
  app.use(async (ctx) => {
    ctx.response.status = oak.Status.NotFound;
    ctx.response.body = `"${ctx.request.url}" not found`;
  });

  app.addEventListener(
    "listen",
    ({ port }) => {
      const event = options?.triggerEvent;
      if (event) {
        console.info(
          ` Trigger(s): ${
            event.paths.map((p) =>
              `${colors.underline(colors.brightBlue(event.kind))} ${
                colors.yellow(path.resolve(p))
              }`
            ).join("\n             ")
          }`,
        );
      }
      if (options?.watching) {
        const watchFS = typeof options?.watching === "string"
          ? [options?.watching]
          : options?.watching;
        for (const watching of watchFS) {
          console.info(`   Watching: ${colors.yellow(path.resolve(watching))}`);
        }
      }
      console.info(`       Root: ${colors.yellow(staticRoot)}`);
      if (options?.processStartTimestamp) {
        const iteration = options?.iterationCount || -1;
        const duration = new Date().valueOf() -
          options?.processStartTimestamp.valueOf();
        console.info(
          // deno-fmt-ignore
          `   Built in: ${colors.brightBlue((duration / 1000).toString())} seconds ${colors.dim(`(iteration ${iteration})`)}`,
        );
      }
      const mem = Deno.memoryUsage();
      console.info(
        `     Memory: ${colors.gray("rss")} ${
          human.humanFriendlyBytes(mem.rss)
        } ${colors.gray("heapTotal")} ${
          human.humanFriendlyBytes(mem.heapTotal)
        } ${colors.gray("heapUsed")}: ${
          human.humanFriendlyBytes(mem.heapUsed)
        } ${colors.gray("external")}: ${
          human.humanFriendlyBytes(mem.external)
        }`,
      );
      console.info(`    Address: ${colors.green(`http://localhost:${port}`)}`);
      console.info(`    ======== [${new Date()}] ========`);
    },
  );

  return app;
};

export async function willSendStatic(
  // deno-lint-ignore no-explicit-any
  { request }: oak.Context<any>,
  root: string,
  index: string,
): Promise<[string, Deno.FileInfo] | undefined> {
  let candidate = request.url.pathname;
  const trailingSlash = candidate[candidate.length - 1] === "/";
  candidate = oakUtil.decodeComponent(
    candidate.substr(path.parse(candidate).root.length),
  );
  if (index && trailingSlash) {
    candidate += index;
  }

  candidate = oakUtil.resolvePath(root, candidate);
  let stats: Deno.FileInfo;
  try {
    stats = await Deno.stat(candidate);
    if (stats.isDirectory) {
      candidate += `/${index}`;
    }
    return [candidate, stats];
  } catch (_err) {
    return undefined;
  }
}

export async function experimentalServerListen(
  watchFS: string | string[],
  allowReload: (
    event: Deno.FsEvent,
    watcher: Deno.FsWatcher,
  ) => Promise<boolean>,
  onReload: (oc: ExperimentalServerOperationalContext) => Promise<boolean>,
  esoc: Pick<
    ExperimentalServerOperationalContext,
    "processStartTimestamp" | "iterationCount"
  >,
  port = 8003,
) {
  let abortController: AbortController | undefined = undefined;
  let listener: Promise<void> | undefined = undefined;
  const liveReloadSockets: WebSocket[] = [];

  const listen = async (oc: ExperimentalServerOperationalContext) => {
    if (abortController && listener) {
      abortController.abort();
      await listener;
    }

    abortController = new AbortController();
    const app = experimentalServer(oc);
    for (const lrSocket of liveReloadSockets) {
      // when the socket is closed, it will force reload on the client because
      // the websocket closed signal is what is monitored
      lrSocket.close(-1, "reload");
      console.log("closed lrSocket, reload request sent to browser");
    }

    listener = app.listen({
      port,
      signal: abortController.signal,
    });
  };

  listen({
    watching: watchFS,
    isReloadRequest: false,
    liveReloadSockets,
    ...esoc,
  });

  const watcher = Deno.watchFs(watchFS, { recursive: true });
  let isReloading = false;
  for await (const event of watcher) {
    if (!(await allowReload(event, watcher))) continue;
    if (isReloading) {
      continue;
    }

    console.info(colors.brightMagenta("*".repeat(79)));
    console.info(colors.brightMagenta(`* Refreshing experimental pages `));
    console.info(
      colors.brightMagenta(`* ${colors.brightBlue(new Date().toString())}`),
    );
    console.info(colors.brightMagenta("*".repeat(79)));

    isReloading = true;
    const oc: ExperimentalServerOperationalContext = {
      processStartTimestamp: new Date(),
      iterationCount: esoc.iterationCount + 1,
      watching: watchFS,
      triggerEvent: event,
      isReloadRequest: true,
      liveReloadSockets,
    };
    const reload = await onReload(oc);
    if (reload) listen(oc);

    // TODO: set a timeout to wait a little while between update events
    setTimeout(() => (isReloading = false), 500);
  }
}
