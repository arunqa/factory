import { events, path } from "../../../../core/deps.ts";
import { oak } from "../deps.ts";

export type ResolvedStaticPathOnServer = string;

export interface StaticContentContextSupplier {
  // deno-lint-ignore no-explicit-any
  readonly oakCtx: oak.Context<any>;
  readonly servedCount: number;
}

export interface StaticServedTarget {
  readonly status: number;
  readonly locationHref: string;
  readonly extn: string;
  readonly fsTarget: string;
  readonly fsTargetSymLink?: string;
}

async function staticServedTarget(
  ctx: oak.Context,
  target: string,
  showFilesRelativeTo: string,
): Promise<StaticServedTarget> {
  const followedSymLink = await Deno.realPath(target);
  return {
    status: ctx.response.status,
    locationHref: ctx.request.url.pathname,
    extn: path.extname(target),
    fsTarget: path.relative(showFilesRelativeTo, target),
    fsTargetSymLink: target != followedSymLink
      ? path.relative(showFilesRelativeTo, followedSymLink)
      : undefined,
  };
}

export interface StaticServeOpportunityEvent {
  readonly sccs: StaticContentContextSupplier;
  readonly root: string;
  readonly target: ResolvedStaticPathOnServer;
}

export interface StaticServedEvent {
  readonly sccs: StaticContentContextSupplier;
  readonly serveStartedMark: PerformanceMark;
  readonly target?: StaticServedTarget;
}

export interface StaticAccessErrorEvent {
  readonly sccs: StaticContentContextSupplier;
  readonly target: ResolvedStaticPathOnServer;
  readonly error: Error;
}

export class StaticEventEmitter extends events.EventEmitter<{
  before(sccs: StaticContentContextSupplier): Promise<void>;
  transform(ssoe: StaticServeOpportunityEvent): Promise<void>;
  served(sae: StaticServedEvent): Promise<void>;
  error(saee: StaticAccessErrorEvent): Promise<void>;
}> {}

export function staticContentMiddleware(
  content: { readonly staticAssetsHome: string },
  staticEE: StaticEventEmitter,
  staticIndex: string,
  translatePath?: (path: string) => string,
  beforeFirstServe?: (sccs: StaticContentContextSupplier) => Promise<void>,
  // deno-lint-ignore no-explicit-any
): oak.Middleware<any> {
  let servedCount = 0;
  return async (ctx) => {
    const resourcePathRequestedByUA = ctx.request.url.pathname;
    const resolvedStaticPathOnServer = translatePath
      ? translatePath(resourcePathRequestedByUA)
      : resourcePathRequestedByUA;
    const sccs: StaticContentContextSupplier = { oakCtx: ctx, servedCount };
    const staticAssetsHome = content.staticAssetsHome;
    try {
      if (servedCount == 0 && beforeFirstServe) await beforeFirstServe(sccs);
      await staticEE.emit("before", sccs);
      await staticEE.emit("transform", {
        sccs,
        root: staticAssetsHome,
        target: resolvedStaticPathOnServer,
      });
      const serveStartedMark = performance.mark(resolvedStaticPathOnServer);
      const target = await ctx.send({
        root: staticAssetsHome,
        index: staticIndex,
        path: resolvedStaticPathOnServer,
        contentTypes: {
          ".cjs": "application/javascript",
        },
      });
      await staticEE.emit("served", {
        target: target
          ? await staticServedTarget(ctx, target, staticAssetsHome)
          : undefined,
        sccs,
        serveStartedMark,
      });
    } catch (error) {
      await staticEE.emit(
        "error",
        { sccs, error, target: resolvedStaticPathOnServer },
      );
    }
    servedCount++;
  };
}
