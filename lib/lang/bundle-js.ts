import { events } from "./deps.ts";

export interface TypescriptSupplier {
  readonly srcRootSpecifier: string;
}

export interface BundledTypescriptEvent extends TypescriptSupplier {
  readonly er: Deno.EmitResult;
}

export interface BundledJavascriptSupplier {
  readonly bundledJS: () => string;
}

export interface NotBundledTypescriptEvent<ReasonCtx>
  extends TypescriptSupplier {
  readonly reason:
    | "business-rule"
    | "src-not-found"
    | "diagnosable-error"
    | "undiagnosable-error"
    | string;
  readonly reasonCtx?: ReasonCtx;
}

export class TransformTypescriptEventEmitter extends events.EventEmitter<{
  bundledToJS(
    evt: BundledTypescriptEvent & BundledJavascriptSupplier,
  ): Promise<void>;
  persistedToJS(
    jsAbsPath: string,
    evt: BundledTypescriptEvent & BundledJavascriptSupplier,
  ): Promise<void>;
  notBundledToJS(evt: NotBundledTypescriptEvent<unknown>): Promise<void>;
  diagnosableBundleIssue(evt: BundledTypescriptEvent): Promise<void>;
  undiagnosableBundleError(ts: TypescriptSupplier, e: Error): Promise<void>;
}> {}

export interface TransformTypescriptOptions {
  readonly ee?: TransformTypescriptEventEmitter;
  readonly shouldBundle?: (
    rootSpecifier: string,
    dfi: Deno.FileInfo,
  ) => Promise<true | [string, unknown]>;
  readonly onBundledToJS: (
    evt: BundledTypescriptEvent & BundledJavascriptSupplier,
  ) => Promise<void>;
}

export async function transformTypescriptToJS(
  ts: TypescriptSupplier,
  options?: TransformTypescriptOptions,
) {
  const { srcRootSpecifier } = ts;
  try {
    const stat = await Deno.lstat(ts.srcRootSpecifier);
    if (options?.shouldBundle) {
      const should = await options.shouldBundle(srcRootSpecifier, stat);
      if (should != true) {
        const [reason, reasonCtx] = should;
        await options?.ee?.emit("notBundledToJS", {
          reason: reason || "business-rule",
          reasonCtx,
          ...ts,
        });
        return;
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      await options?.ee?.emit("notBundledToJS", {
        reason: "src-not-found",
        ...ts,
      });
      return;
    }
    throw err;
  }

  try {
    const er = await Deno.emit(srcRootSpecifier, {
      bundle: "classic",
      compilerOptions: {
        lib: ["deno.unstable", "deno.window"],
      },
    });
    if (er.diagnostics.length) {
      await options?.ee?.emit("diagnosableBundleIssue", { ...ts, er });
    } else {
      const event = {
        ...ts,
        er,
        bundledJS: () => er.files["deno:///bundle.js"],
      };
      options?.onBundledToJS?.(event);
      await options?.ee?.emit("bundledToJS", event);
    }
  } catch (error) {
    await options?.ee?.emit("undiagnosableBundleError", ts, error);
  }
}

export async function bundleJsFromTsTwinIfNewer(
  jsAbsPath: string,
  ee?: TransformTypescriptEventEmitter,
) {
  await transformTypescriptToJS(
    {
      srcRootSpecifier: `${jsAbsPath}.ts`,
    },
    {
      ee,
      shouldBundle: async (src, srcStat) => {
        const destStat = await Deno.lstat(jsAbsPath);
        if (srcStat.mtime && destStat.mtime) {
          if (srcStat.mtime.getTime() < destStat.mtime.getTime()) {
            return ["dest-is-newer-than-src", {
              src,
              srcStat,
              dest: jsAbsPath,
              destStat,
            }];
          }
        }
        return true;
      },
      onBundledToJS: async (event) => {
        await Deno.writeTextFile(jsAbsPath, event.bundledJS());
        await ee?.emit("persistedToJS", jsAbsPath, event);
      },
    },
  );
}
