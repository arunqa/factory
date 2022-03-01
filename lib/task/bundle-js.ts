import * as colors from "https://deno.land/std@0.123.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.123.0/path/mod.ts";
import * as fsi from "../fs/inspect.ts";
import * as bjs from "../lang/bundle-js.ts";

const relativeToCWD = (absPath: string) => path.relative(Deno.cwd(), absPath);

/**
 * bundleJsFromTsTwin is used in Taskfile.ts to find all *.js.ts and create
 * it's "twin" *.js file by using Deno.emit(). The default bundler rules are:
 * 1. Find all *.js files
 * 2. For each *.js file, see if it has a "twin" *.js.ts
 * 3. If a JS file is called xyz.auto.js (a good convention), .auto. is removed
 *    before checking
 * @param originRootPath which directory to start in, defaults to Deno.cwd()
 */
export function bundleJsFromTsTwinTask(
  originRootPath = Deno.cwd(),
  observer: bjs.TransformTypescriptEventEmitter = consoleEE(),
) {
  return async () => {
    for await (
      const asset of fsi.discoverAssets({
        glob: "**/*.js",
        originRootPath,
      })
    ) {
      const available = await bjs.jsHasTsTwin(asset.path);
      if (available) {
        await bjs.bundleJsFromTsTwin(
          asset.path,
          bjs.typicalJsTwinTsNamingStrategy,
          observer,
        );
      } else {
        console.warn(
          colors.dim(
            `${relativeToCWD(asset.path)} does not have a Typescript twin`,
          ),
        );
      }
    }
  };
}

/**
 * discoverBundleJsFromTsTwinTask is used in Taskfile.ts to discover all *.js.ts
 * files as a "dry-run" for bundleJsFromTsTwinIfNewerTask.
 * @param originRootPath which directory to start in, defaults to Deno.cwd()
 */
export function discoverBundleJsFromTsTwinTask(originRootPath = Deno.cwd()) {
  return async () => {
    for await (
      const asset of fsi.discoverAssets({
        glob: "**/*.js",
        originRootPath,
      })
    ) {
      const available = await bjs.jsHasTsTwin(asset.path);
      if (available) {
        const [twinPath, _twinStat] = available;
        console.info(
          colors.magenta(
            `*** ${
              colors.white(relativeToCWD(asset.path))
            } may be bundled from ${colors.yellow(relativeToCWD(twinPath))}`,
          ),
        );
      }
    }
  };
}

function consoleEE() {
  const ttConsoleEE = new bjs.TransformTypescriptEventEmitter();
  // deno-lint-ignore require-await
  ttConsoleEE.on("persistedToJS", async (jsAbsPath, event) => {
    console.info(
      colors.magenta(
        `*** ${colors.yellow(relativeToCWD(jsAbsPath))} generated from ${
          colors.green(relativeToCWD(event.srcRootSpecifier))
        }`,
      ),
    );
  });
  // deno-lint-ignore require-await
  ttConsoleEE.on("notBundledToJS", async (event) => {
    console.info(
      colors.magenta(
        `*** ${
          colors.yellow(relativeToCWD(event.srcRootSpecifier))
        } not generated: ${colors.blue(event.reason)}`,
      ),
    );
    if (event.er) {
      console.warn("    ", Deno.formatDiagnostics(event.er.diagnostics));
    }
    if (event.error) {
      console.error("   ", colors.red(event.error.toString()));
    }
  });
  return ttConsoleEE;
}
