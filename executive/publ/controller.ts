import { colors, events, path } from "../../core/deps.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as human from "../../lib/text/human.ts";
import * as whs from "../../lib/text/whitespace.ts";
import * as bjs from "../../lib/package/bundle-js.ts";
import * as sqlite from "../../lib/db/sqlite-db.ts";
import * as server from "./server/server.ts";
import * as publ from "./publication.ts";
import * as psDB from "./publication-db.ts";
import * as psds from "./publication-db-schema.auto.ts";

declare global {
  function touchWatchedSemaphoreFile(): Promise<void>;
}

export type ExecutiveControllerCleanupNature =
  | "lifecycle"
  | "Deno.exit"
  | "unload";

export interface ExecutiveControllerCleanupContext<
  OperationalCtx extends publ.PublicationOperationalContext,
> {
  readonly nature: ExecutiveControllerCleanupNature;
  readonly controller: ExecutiveController<OperationalCtx>;
}

export class ExecutiveControllerEventsEmitter<
  OperationalCtx extends publ.PublicationOperationalContext,
> extends events.EventEmitter<{
  cleanup(ec: ExecutiveControllerCleanupContext<OperationalCtx>): Promise<void>;
}> {}

export interface ExecutiveControllerHomePathSupplier {
  (relative: string, abs?: boolean): string;
}

export interface ExecutiveController<
  OperationalCtx extends publ.PublicationOperationalContext,
> {
  readonly events: ExecutiveControllerEventsEmitter<OperationalCtx>;
  readonly operationalCtx: OperationalCtx;
  readonly serverOptions: server.PublicationServerOptions;
  readonly modulePath: ExecutiveControllerHomePathSupplier;
  readonly cleanup: (nature: ExecutiveControllerCleanupNature) => Promise<void>;
}

export interface ExecutiveControllerSupplier<
  OperationalCtx extends publ.PublicationOperationalContext,
> {
  (): Promise<ExecutiveController<OperationalCtx>>;
}

export class Executive<
  OperationalCtx extends publ.PublicationOperationalContext,
> {
  constructor(
    readonly controller: ExecutiveController<OperationalCtx>,
    readonly publications: publ.Publication<OperationalCtx>[],
  ) {
  }

  async publish() {
    await Promise.all(
      this.publications.map((p) => p.produce()),
    );

    if (this.controller.operationalCtx.isExperimentalOperationalCtx) {
      await this.serve();
    }
  }

  async replayMemoized(
    publication: publ.Publication<OperationalCtx>,
    qualifiedPath: rfGovn.RouteLocation,
  ) {
    const produced = await publication.state.resourcesIndex
      .replayMemoizedProducer(qualifiedPath);
    if (produced) {
      console.log(
        colors.green(`*** regenerated ${colors.yellow(qualifiedPath)}`),
      );
    } else {
      if (qualifiedPath.endsWith(".ts")) {
        console.log(
          colors.red(
            `*** ${qualifiedPath} was not memoized, need to restart the hot reload server`,
          ),
        );
      }
    }
  }

  async serve(publication = this.publications[0]) {
    const ctl = this.controller;
    const oc = ctl.operationalCtx;
    const db = oc.publStateDB();
    const ps = new class extends server.PublicationServer {
      server() {
        const result = super.server();
        ctl.events.on("cleanup", async ({ nature }) => {
          console.log(colors.gray(`[cleanup] ${nature}: Close tunnels`));
          if (this.console) await this.console.tunnel.cleanup();
        });
        result.app.addEventListener("listen", (event) => {
          const iterationIndex = oc.iterationCount || -1;
          const buildCompletedAt = new Date();
          const buildDurationMs = buildCompletedAt.valueOf() -
            oc.processStartTimestamp.valueOf();
          const be: Omit<psds.PublBuildEventInsertable, "publHostId"> = {
            buildInitiatedAt: oc.processStartTimestamp,
            buildCompletedAt: new Date(),
            buildDurationMs,
            iterationIndex,
            resourcesOriginatedCount:
              this.publication.state.resourcesIndex.resourcesIndex.length,
            resourcesPersistedCount:
              this.publication.state.persistedIndex.persistedDestFiles.size,
            resourcesMemoizedCount: this.publication.config.memoizeProducers
              ? publication.state.resourcesIndex.memoizedProducers.size
              : undefined,
          };
          db.persistBuildEvent(be);
          // deno-fmt-ignore
          console.info(`   Built in: ${colors.brightMagenta((buildDurationMs / 1000).toString())} seconds ${colors.dim(`(iteration ${iterationIndex})`)}`);
          // deno-fmt-ignore
          console.info(`    Serving: ${colors.yellow(this.publication.config.destRootPath)}`);
          // deno-fmt-ignore
          console.info(`Publication: ${colors.green(be.resourcesOriginatedCount.toString())} resources, ${colors.green(be.resourcesPersistedCount.toString())} persisted${be.resourcesMemoizedCount ? `, ${colors.green(be.resourcesMemoizedCount.toString())} memoized` : ''}`);
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
          // deno-fmt-ignore
          console.info(`   Database: ${colors.yellow(this.publication.config.operationalCtx.publStateDbLocation?.(true) || "none")}`);
          const serviceStartedAt = new Date();
          console.info(
            `    ======== Ready to serve [${serviceStartedAt}] ========`,
          );
          db.persistServerService({
            listenHost: this.listenHostname,
            listenPort: this.listenPort,
            publishUrl: this.publicURL(),
            serviceStartedAt,
          });
          // deno-fmt-ignore
          console.info(`    Address: ${colors.brightBlue(ps.publicURL('/'))} ${colors.dim(`(listening on ${event.hostname}:${event.port})`)}`);
          if (ps.console) {
            // deno-fmt-ignore
            console.info(`    Console: ${colors.brightBlue(ps.publicURL(ps.console.htmlEndpointURL))}/`);
          }
        });
        result.router.get("/server/restart", async (ctx) => {
          // result.lifecycleMgr.requestRestart("/server/restart");
          if (globalThis.touchWatchedSemaphoreFile) {
            await globalThis.touchWatchedSemaphoreFile();
            ctx.response.body =
              `${ctx.request.url} executed globalThis.touchWatchedSemaphoreFile()`;
          } else {
            ctx.response.body =
              `${ctx.request.url} does not implement globalThis.touchWatchedSemaphoreFile`;
          }
        });
        // deno-lint-ignore require-await
        result.router.get("/server/shutdown", async () => {
          result.lifecycleMgr.requestShutdown("/server/shutdown");
        });
        return result;
      }
    }(publication, ctl.serverOptions);
    ps.staticEE.on("before", async (psac) => {
      await this.replayMemoized(publication, psac.oakCtx.request.url.pathname);
    });
    // deno-lint-ignore require-await
    ps.tsTransformEE.on("persistedToJS", async (target, event) => {
      // deno-fmt-ignore
      console.info(colors.magenta(`*** ${colors.yellow(target.jsAbsPath)} generated from ${colors.green(event.tsSrcRootSpecifier)}`));
    });
    // deno-lint-ignore require-await
    ps.tsTransformEE.on("notBundledToJS", async (event) => {
      switch (event.reason) {
        case "src-not-found":
        case "dest-is-newer-than-src":
          // nothing of interest, so skip it
          return;
      }
      // deno-fmt-ignore
      console.info(colors.magenta(`*** ${colors.yellow(event.tsSrcRootSpecifier)} not generated: ${colors.blue(event.reason)}`));
      if (event.er) {
        console.warn("    ", Deno.formatDiagnostics(event.er.diagnostics));
      }
      if (event.error) {
        console.error("   ", colors.red(event.error.toString()));
      }
    });
    await ps.serve();
  }

  async cleanup(nature: ExecutiveControllerCleanupNature = "lifecycle") {
    await this.controller.cleanup(nature);
  }
}

export function typicalPublicationCtlSupplier<
  OperationalCtx extends publ.PublicationOperationalContext,
>(
  modulePath: ExecutiveControllerHomePathSupplier,
  enhanceOC: (
    supplied: publ.PublicationOperationalContext,
    modulePath: ExecutiveControllerHomePathSupplier,
  ) => OperationalCtx,
  options?: {
    readonly events?: ExecutiveControllerEventsEmitter<
      OperationalCtx
    >;
    readonly pubCtlEnvVarsPrefix?: string;
    readonly isExperimentalOperationalCtx?: (guess: boolean) => boolean;
    readonly isLiveReloadRequest?: (
      guess: boolean,
      isExperimentalOperationalCtx: boolean,
    ) => boolean;
    readonly autoCleanupOnUnload?: boolean;
    readonly exitOnCtrlC?: boolean;
  },
): ExecutiveControllerSupplier<OperationalCtx> {
  const events = options?.events || new ExecutiveControllerEventsEmitter();
  const pubCtlEnvVarsPrefix = options?.pubCtlEnvVarsPrefix || "PUBCTL_";

  // see if a process start time is provided and record it; we delete the env var
  // in case we're running in Deno's `--watch` mode and might get reloaded
  const processStartTimeEnvVarName = `${pubCtlEnvVarsPrefix}EXEC_STARTDATE`;
  const timestampAtEntryEnv = Deno.env.get(processStartTimeEnvVarName);
  Deno.env.delete(processStartTimeEnvVarName);

  const processIterationCountEnvVarName =
    `${pubCtlEnvVarsPrefix}ITERATION_COUNT`;
  let processIterationCount = 1;
  if (timestampAtEntryEnv) {
    // this is the first time we're being called (whether in watch mode or not)
    processIterationCount = 1;
  } else {
    // this means we're in watch mode, being called for the second or greater time
    const icEnvVarValue = Deno.env.get(processIterationCountEnvVarName);
    if (icEnvVarValue) {
      processIterationCount = Number.parseInt(icEnvVarValue);
    }
  }
  Deno.env.set(processIterationCountEnvVarName, `${processIterationCount + 1}`);

  const isExperimentalOperationalCtxGuess = Deno.args.length == 1 &&
    Deno.args[0].startsWith("server");
  const isExperimentalOperationalCtx = options?.isExperimentalOperationalCtx
    ? options?.isExperimentalOperationalCtx(isExperimentalOperationalCtxGuess)
    : isExperimentalOperationalCtxGuess;
  const isLiveReloadRequestGuess = isExperimentalOperationalCtx &&
    processIterationCount > 1;
  const isLiveReloadRequest = options?.isLiveReloadRequest
    ? options?.isLiveReloadRequest(
      isLiveReloadRequestGuess,
      isExperimentalOperationalCtx,
    )
    : isLiveReloadRequestGuess;

  // our start time depends on whether or not we have a process start time or our
  // own internal script start time
  const processStartTimestamp = timestampAtEntryEnv
    ? new Date(Number(timestampAtEntryEnv) * 1000)
    : new Date();

  // deno-lint-ignore require-await
  return async (): Promise<ExecutiveController<OperationalCtx>> => {
    const serverListenEnvVarsPrefix = `${pubCtlEnvVarsPrefix}SERVER_`;
    const listenPort = Number.parseInt(
      Deno.env.get(`${serverListenEnvVarsPrefix}LISTEN_PORT`) ?? "8003",
    );
    const listenHostname =
      Deno.env.get(`${serverListenEnvVarsPrefix}LISTEN_HOSTNAME`) ??
        "0.0.0.0";
    const publicUrlLocation =
      Deno.env.get(`${serverListenEnvVarsPrefix}PUBLIC_URL_LOCATION`) ??
        `http://${listenHostname}:${listenPort}`;

    const badgenRemoteBaseURL = Deno.env.get(
      "RF_UNIVERSAL_BADGEN_REMOTE_BASE_URL",
    );

    const storageFileName = modulePath("pubctl.sqlite.db");
    const serverStateDB = new psDB.PublicationDatabase({
      storageFileName: () => storageFileName,
      autoCloseOnUnload: true,
      events: () => new sqlite.DatabaseEventEmitter(),
    });

    serverStateDB.dbee.on("openedDatabase", () => {
      console.info(
        colors.dim(`opened database ${serverStateDB.dbStoreFsPath}`),
      );
    });
    serverStateDB.dbee.on("closingDatabase", () => {
      console.info(
        colors.dim(`closing database ${serverStateDB.dbStoreFsPath}`),
      );
    });
    serverStateDB.init();

    const ocGuess: publ.PublicationOperationalContext = {
      projectRootPath: modulePath,
      processStartTimestamp,
      isExperimentalOperationalCtx,
      isLiveReloadRequest,
      iterationCount: processIterationCount,
      publStateDB: () => serverStateDB,
      publStateDbLocation: () => storageFileName,
      produceOperationalCtxCargo: async (home) => {
        await Deno.writeTextFile(
          path.join(home, "index.json"),
          JSON.stringify(
            {
              isExperimentalOperationalCtx,
              publicUrlLocation,
              badgenRemoteBaseURL,
            },
            undefined,
            "  ",
          ),
        );
        if (isExperimentalOperationalCtx) {
          await Deno.writeTextFile(
            path.join(home, "deps.js.ts"),
            whs.unindentWhitespace(`
            /**
             * deps.js.ts is a Typescript-friendly Deno-style strategy of bringing in
             * selective server-side Typescript functions and modules into client-side
             * browser and other user agent Javascript. deps.js.ts is Deno-bundled into
             * deps.auto.js assuming that deps.auto.js exists as a "twin".
             * For instructions, see resFactory/factory/lib/package/README.md
             */
            export * from "https://raw.githubusercontent.com/ihack2712/eventemitter/1.2.4/mod.ts";

            // relative to public/operational-context/deps.js.ts (using managed Git repo structure)
            // TODO: remove hardcoding
            export * from "../../../../../github.com/resFactory/factory/lib/service-bus/core/mod.ts";
            export * from "../../../../../github.com/resFactory/factory/lib/service-bus/service/ping.ts";
            export * from "../../../../../github.com/resFactory/factory/lib/service-bus/service/file-impact.ts";
            export * from "../../../../../github.com/resFactory/factory/lib/presentation/custom-element/badge/mod.ts";`),
          );
          const serverAutoJsDepsAbsPath = path.join(home, "deps.auto.js");
          await Deno.writeTextFile(
            serverAutoJsDepsAbsPath,
            "// purposefully empty, will be filled in by bundleJsFromTsTwin, see see resFactory/factory/lib/package/README.md",
          );
          await bjs.bundleJsFromTsTwin(
            bjs.jsPotentialTsTwin(
              bjs.typicalJsNamingStrategy(serverAutoJsDepsAbsPath),
            ),
          );
          // symlink resFactory/factory/executive/publ/server/middleware/workspace/ua-operational-ctx.js to
          // public/operational-context/server.auto.js which will allow console to "hook into" non-console
          // pages; operational-context/server.auto.js is included via <script> tag in pages that want to
          // have auto-reload and other "workspace" functions.
          await Deno.symlink(
            path.join(
              path.dirname(path.fromFileUrl(import.meta.url)),
              "server",
              "middleware",
              "workspace",
              "ua-operational-ctx.js",
            ),
            path.join(home, "server.auto.js"),
          );
        }
      },
    };

    const serverOptions: server.PublicationServerOptions = {
      serverStateDB,
      staticIndex: "index.html",
      listenPort,
      listenHostname,
      publicURL: (path = "/") => {
        return `${publicUrlLocation}${path}`;
      },
    };
    const operationalCtx = enhanceOC(ocGuess, modulePath);
    const result: ExecutiveController<OperationalCtx> = {
      operationalCtx,
      modulePath,
      events,
      cleanup: async (nature): Promise<void> => {
        await events.emit("cleanup", { nature, controller: result });
        console.info("finished cleaning up on unload");
      },
      serverOptions,
    };

    const autoCleanupOnUnload = options?.autoCleanupOnUnload ?? true;
    if (autoCleanupOnUnload) {
      addEventListener("unload", async () => {
        await result.cleanup("unload");
      });
    }

    const exitOnCtrlC = options?.exitOnCtrlC ?? true;
    if (exitOnCtrlC) {
      Deno.addSignalListener("SIGINT", () => {
        console.info(
          colors.gray("\nCaptured SIGINT, calling Deno.exit() for cleanup."),
        );
        Deno.exit(); // this should emit "unload"
      });
    }

    return result;
  };
}
