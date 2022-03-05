import { events, path } from "./deps.ts";

export interface TypescriptSupplier extends Pick<Deno.EmitOptions, "bundle"> {
  readonly bundle: "classic" | "module";
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
    | "diagnosable-issue"
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
  notBundledToJS(
    evt: NotBundledTypescriptEvent<unknown> & {
      readonly er?: Deno.EmitResult;
      readonly error?: Error;
    },
  ): Promise<void>;
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
        error: err,
      });
      return;
    }
    throw err;
  }

  try {
    const er = await Deno.emit(srcRootSpecifier, {
      bundle: ts.bundle || "module",
      compilerOptions: {
        lib: ["deno.unstable", "deno.window"],
      },
    });
    if (er.diagnostics.length) {
      await options?.ee?.emit("diagnosableBundleIssue", { ...ts, er });
      await options?.ee?.emit("notBundledToJS", {
        reason: "diagnosable-issue",
        ...ts,
        er,
      });
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
    await options?.ee?.emit("notBundledToJS", {
      reason: "undiagnosable-error",
      ...ts,
      error,
    });
  }
}

export interface JsTsTwinNamingStrategy {
  (jsAbsPath: string): [renamed: string, jsType: "module" | "classic"];
}

/**
 * Accept a file path like *.(auto?).{js,cjs,mjs} and normalize it to *.js
 * @param jsAbsPath the full path with .auto., .js, .cjs, or .mjs modifiers
 * @returns "normalized" file with just *.js and no .auto., cjs, or mjs and type of module to emit
 */
export const typicalJsTwinTsNamingStrategy: JsTsTwinNamingStrategy = (
  jsAbsPath,
) => {
  // if the output file looks like xyz.auto.{js,cjs,mjs} rename it to xyz.js so that
  // the Typescript "twin" doesnt have the word auto in there and is normalized to .js
  let renamed = jsAbsPath.replace(".auto.", ".");
  let jsType: "module" | "classic" = "module";
  if (renamed.endsWith(".cjs")) {
    jsType = "classic";
    renamed = renamed.replace(/\.cjs$/i, ".js");
  } else {
    if (renamed.endsWith(".mjs")) {
      renamed = renamed.replace(/\.mjs$/i, ".js");
    }
  }
  return [renamed, jsType];
};

export async function jsHasTsTwin(
  jsAbsPath: string,
  namingStrategy = typicalJsTwinTsNamingStrategy,
): Promise<
  false | [
    twinPath: string,
    twinStat: Deno.FileInfo,
    jsType: "module" | "classic",
  ]
> {
  const [name, jsType] = namingStrategy(jsAbsPath);
  const twinPath = `${name}.ts`;
  try {
    const twinStat = await Deno.lstat(twinPath);
    return [twinPath, twinStat, jsType];
  } catch (error) {
    // if the *.js doesn't exist we want to build it
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

export async function bundleJsFromTsTwin(
  jsAbsPath: string,
  namingStrategy = typicalJsTwinTsNamingStrategy,
  ee?: TransformTypescriptEventEmitter,
) {
  const [name, jsType] = namingStrategy(jsAbsPath);
  await transformTypescriptToJS({
    srcRootSpecifier: `${name}.ts`,
    bundle: jsType,
  }, {
    ee,
    onBundledToJS: async (event) => {
      // we use "portable" reportable filenames that don't include root paths
      // because root paths can change between sandboxes and developers which
      // will cause revision control conflicts for unimportant reasons.
      const bundle = event.bundledJS().replace(
        "// This code was bundled using `deno bundle` and it's not recommended to edit it manually",
        `// Code generated by ${path.basename(import.meta.url)} Deno.emit(${
          path.basename(event.srcRootSpecifier)
        }). DO NOT EDIT.`,
      );
      await Deno.writeTextFile(jsAbsPath, bundle);
      await ee?.emit("persistedToJS", jsAbsPath, event);
    },
  });
}

export async function bundleJsFromTsTwinIfNewer(
  jsAbsPath: string,
  namingStrategy = typicalJsTwinTsNamingStrategy,
  ee?: TransformTypescriptEventEmitter,
) {
  const [name, jsType] = namingStrategy(jsAbsPath);
  await transformTypescriptToJS({
    srcRootSpecifier: `${namingStrategy(name)}.ts`,
    bundle: jsType,
  }, {
    ee,
    shouldBundle: async (src, srcStat) => {
      let destStat: Deno.FileInfo;
      try {
        destStat = await Deno.lstat(jsAbsPath);
      } catch (error) {
        // if the *.js doesn't exist we want to build it
        if (error instanceof Deno.errors.NotFound) {
          return true;
        }
        return ["should-bundle-exception", {
          src,
          srcStat,
          dest: jsAbsPath,
          error,
        }];
      }

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
      // we use "portable" reportable filenames that don't include root paths
      // because root paths can change between sandboxes and developers which
      // will cause revision control conflicts for unimportant reasons.
      const bundle = event.bundledJS().replace(
        "// This code was bundled using `deno bundle` and it's not recommended to edit it manually",
        `// Code generated by ${path.basename(import.meta.url)} Deno.emit(${
          path.basename(event.srcRootSpecifier)
        }) because it was newer than destination. DO NOT EDIT.`,
      );
      await Deno.writeTextFile(jsAbsPath, bundle);
      await ee?.emit("persistedToJS", jsAbsPath, event);
    },
  });
}
