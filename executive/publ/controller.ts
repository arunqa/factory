import { colors, events, log, path } from "../../core/deps.ts";
import * as rfGovn from "../../governance/mod.ts";
import * as human from "../../lib/text/human.ts";
import * as whs from "../../lib/text/whitespace.ts";
import * as server from "./server.ts";
import * as publ from "./publication.ts";

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
  (relative: string): string;
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
    const ps = new class extends server.PublicationServer {
      server() {
        const result = super.server();
        ctl.events.on("cleanup", async ({ nature }) => {
          console.log(colors.gray(`[cleanup] ${nature}: Close tunnels`));
          if (this.console) await this.console.tunnel.cleanup();
        });
        result.app.addEventListener("listen", (event) => {
          if (oc.processStartTimestamp) {
            const iteration = oc.iterationCount || -1;
            const duration = new Date().valueOf() -
              oc.processStartTimestamp.valueOf();
            // deno-fmt-ignore
            console.info(`   Built in: ${colors.brightMagenta((duration / 1000).toString())} seconds ${colors.dim(`(iteration ${iteration})`)}`);
          }
          // deno-fmt-ignore
          console.info(`    Serving: ${colors.yellow(this.publication.config.destRootPath)}`);
          // deno-fmt-ignore
          console.info(`Publication: ${colors.green(this.publication.state.resourcesIndex.resourcesIndex.length.toString())} resources, ${colors.green(this.publication.state.persistedIndex.persistedDestFiles.size.toString())} persisted${this.publication.config.memoizeProducers ? `, ${colors.green(publication.state.resourcesIndex.memoizedProducers.size.toString())} memoized` : ''}`);
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
          console.info(
            `    ======== Ready to serve [${new Date()}] ========`,
          );
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

  return async (): Promise<ExecutiveController<OperationalCtx>> => {
    const fh = new log.handlers.FileHandler("DEBUG", {
      formatter: (logRecord) => JSON.stringify(logRecord),
      filename: modulePath("pubctl-diagnostics.jsonl"),
      mode: "a",
    });
    await fh.setup();
    const serverDiagnosticsLogger = new log.Logger("server", "DEBUG", {
      handlers: [fh],
    });

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

    const ocGuess: publ.PublicationOperationalContext = {
      processStartTimestamp,
      isExperimentalOperationalCtx,
      isLiveReloadRequest,
      iterationCount: processIterationCount,
      produceOperationalCtxCargo: async (home) => {
        await Deno.writeTextFile(
          path.join(home, "server.js"),
          whs.unindentWhitespace(`
          const rfOperationalCtx = {
            isExperimentalOperationalCtx: ${isExperimentalOperationalCtx},
            publicUrlLocation: '${publicUrlLocation}',
            publicURL: function (path) { return '${publicUrlLocation}' + path },
            console: {
              location: function (path) { return '${publicUrlLocation}' + '/console' + path },
              tunnel: {
                sseHealthURL: '${publicUrlLocation}' + '/console/sse/ping',
                sseURL: '${publicUrlLocation}' + '/console/sse/tunnel',
              }
            },
            workspace: {
              footerContentDomID: "rf-universal-footer-experimental-server-workspace",
              isHotReloadAvailable: true,
              tunnel: {
                sseHealthURL: '${publicUrlLocation}' + '/workspace/sse/ping',
                sseURL: '${publicUrlLocation}' + '/workspace/sse/tunnel',
                events: {
                  "workspace.file-impact": function (event) {
                    const payload = JSON.parse(event.data);
                    // window.rfTerminalRoute should be set by any RF-generated page so we check
                    // to see if the "impacted" workspace file is our current page
                    const activePageFileSysPath = window.rfTerminalRoute?.fileSysPath;
                    if (activePageFileSysPath == payload.fsAbsPathAndFileName) {
                      location.reload();
                    } else {
                      console.info("Received workspace.file-impact but this page was not impacted", payload, window.rfTerminalRoute);
                    }
                  }
                },
              },
              provision: function (clientLayout) {
                // we're not running in a server that supports experimental workspace (IDE)
                if(!window.rfOperationalCtx.isExperimentalOperationalCtx) return;

                document.addEventListener('DOMContentLoaded', function () {
                  const statePresentation = new TunnelStatePresentation((defaults) => ({ ...defaults, defaultLabel: 'Hot Reload Page' }));
                  const tunnels = new Tunnels((defaults) => ({ ...defaults, baseURL: '/workspace', statePresentation })).init();
                  const wsTunnel = tunnels.registerEventSourceState(new EventSourceTunnelState(tunnels, (defaults) => ({
                      ...defaults,
                      identity: () => "Workspace SSE",
                  })));
                  wsTunnel.statePresentation.display();
                  wsTunnel.addEventSourceEventListener("ping", (evt) => { }, { diagnose: true });
                  wsTunnel.addEventSourceEventListener("workspace.file-impact", (evt) => {
                      const payload = JSON.parse(event.data);
                      // window.rfTerminalRoute should be set by any RF-generated page so we check
                      // to see if the "impacted" workspace file is our current page
                      const activePageFileSysPath = window.rfTerminalRoute?.fileSysPath;
                      if (activePageFileSysPath == payload.fsAbsPathAndFileName) {
                        location.reload();
                      } else {
                        console.info("Received workspace.file-impact but this page was not impacted", payload, window.rfTerminalRoute);
                      }
                  });

                  const footerContentElem = document.getElementById(window.rfOperationalCtx.workspace.footerContentDomID);
                  if (footerContentElem) {
                    footerContentElem.style.display = 'block';
                    const htmlDataSet = document.documentElement.dataset;
                    if(htmlDataSet.rfOriginLayoutSrc) {
                      footerContentElem.innerHTML = \`<p title="\${htmlDataSet.rfOriginLayoutSrc}" class="localhost-diags">
                      Using layout <code class="localhost-diags-layout-origin">\${htmlDataSet.rfOriginLayoutName}</code>
                      (<code class="localhost-diags-layout-origin">\${htmlDataSet.rfOriginLayoutSymbol}</code>) in
                      <code class="localhost-diags-layout-origin-src">\${htmlDataSet.rfOriginLayoutSrc.split('/').reverse()[0]}</code></p>\`;
                    } else {
                      footerContentElem.innerHTML = \`<p title="\${htmlDataSet.rfOriginLayoutSrc}" class="localhost-diags localhost-diags-warning">No layout information in <code>&lt;html data-rf-origin-layout-*&gt;</code></p>\`;
                    }
                  }
                });
              }
            },
          }

          window.rfOperationalCtx = rfOperationalCtx`), // TODO: use HtmlLayoutClientCargoSupplier variables, don't hardcode
        );
      },
    };

    const serverOptions: server.PublicationServerOptions = {
      serverDiagnosticsLogger,
      staticIndex: "index.html",
      listenPort,
      listenHostname,
      publicURL: (path?) => {
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
