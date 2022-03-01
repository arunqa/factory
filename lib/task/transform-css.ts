import * as colors from "https://deno.land/std@0.123.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.123.0/path/mod.ts";
import * as fsi from "../fs/inspect.ts";
import * as bcss from "../lang/bundle-css.ts";

const relativeToCWD = (absPath: string) => path.relative(Deno.cwd(), absPath);

/**
 * transformCssFromTsTwinTask is used in Taskfile.ts to find all *.css.ts and create
 * it's "twin" *.css file by. The default transformation rules are:
 * 1. Find all *.css files
 * 2. For each *.css file, see if it has a "twin" *.css.ts
 * 3. If a JS file is called xyz.auto.css (a good convention), .auto. is removed
 *    before checking
 * @param originRootPath which directory to start in, defaults to Deno.cwd()
 */
export function transformCssFromTsTwinTask(
  originRootPath = Deno.cwd(),
  observer: bcss.TransformStylesheetEventEmitter = consoleEE(),
) {
  return async () => {
    for await (
      const asset of fsi.discoverAssets({
        glob: "**/*.css",
        originRootPath,
      })
    ) {
      const available = await bcss.cssHasTsTwin(asset.path);
      if (available) {
        await bcss.bundleStylesheetFromTsTwin(
          asset.path,
          bcss.typicalCssTwinTsNamingStrategy,
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
export function discoverBundleCssFromTsTwinTask(originRootPath = Deno.cwd()) {
  return async () => {
    for await (
      const asset of fsi.discoverAssets({
        glob: "**/*.css",
        originRootPath,
      })
    ) {
      const available = await bcss.cssHasTsTwin(asset.path);
      if (available) {
        const [twinPath, _twinStat] = available;
        console.info(
          colors.magenta(
            `*** ${
              colors.white(relativeToCWD(asset.path))
            } may be transformed from ${
              colors.yellow(relativeToCWD(twinPath))
            }`,
          ),
        );
      }
    }
  };
}

function consoleEE() {
  const ttConsoleEE = new bcss.TransformStylesheetEventEmitter();
  // deno-lint-ignore require-await
  ttConsoleEE.on("persistedToCSS", async (jsAbsPath, event) => {
    console.info(
      colors.magenta(
        `*** ${colors.yellow(relativeToCWD(jsAbsPath))} generated from ${
          colors.green(relativeToCWD(event.srcRootSpecifier))
        }`,
      ),
    );
  });
  // deno-lint-ignore require-await
  ttConsoleEE.on("notBundledToCSS", async (event) => {
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
