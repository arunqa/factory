import { events, path } from "../../core/deps.ts";
import { oak } from "./deps.ts";

export interface StaticContentContextSupplier {
  // deno-lint-ignore no-explicit-any
  readonly oakCtx: oak.Context<any>;
}

export interface StaticAccessTarget {
  readonly status: number;
  readonly locationHref: string;
  readonly extn: string;
  readonly fsTarget: string;
  readonly fsTargetSymLink?: string;
}

async function staticAccessTarget(
  ctx: oak.Context,
  target: string,
  showFilesRelativeTo: string,
): Promise<StaticAccessTarget> {
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

export interface StaticAccessEvent {
  readonly sccs: StaticContentContextSupplier;
  readonly serveStartedMark: PerformanceMark;
  readonly target?: StaticAccessTarget;
}

export interface StaticAccessErrorEvent {
  readonly sccs: StaticContentContextSupplier;
  readonly target: string;
  readonly error: Error;
}

export class StaticEventEmitter extends events.EventEmitter<{
  before(sccs: StaticContentContextSupplier): Promise<void>;
  served(sae: StaticAccessEvent): Promise<void>;
  error(saee: StaticAccessErrorEvent): Promise<void>;
}> {}

export function staticContentMiddleware(
  content: { readonly staticAssetsHome: string },
  staticEE: StaticEventEmitter,
  staticIndex: string,
  translatePath?: (path: string) => string,
  // deno-lint-ignore no-explicit-any
): oak.Middleware<any> {
  return async (ctx) => {
    const staticPath = ctx.request.url.pathname;
    const requestUrlPath = translatePath
      ? translatePath(staticPath)
      : staticPath;
    const sccs: StaticContentContextSupplier = { oakCtx: ctx };
    const staticAssetsHome = content.staticAssetsHome;
    try {
      await staticEE.emit("before", sccs);
      const serveStartedMark = performance.mark(requestUrlPath);
      const target = await ctx.send({
        root: staticAssetsHome,
        index: staticIndex,
        path: requestUrlPath,
      });
      await staticEE.emit("served", {
        target: target
          ? await staticAccessTarget(ctx, target, staticAssetsHome)
          : undefined,
        sccs,
        serveStartedMark,
      });
    } catch (error) {
      await staticEE.emit(
        "error",
        { sccs, error, target: requestUrlPath },
      );
    }
  };
}
