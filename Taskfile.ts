import * as t from "./lib/task/core.ts";
import * as tcss from "./lib/task/transform-css.ts";
import * as bjs from "./lib/task/bundle-js.ts";
import * as udd from "./lib/task/udd.ts";
import * as gh from "./lib/task/github.ts";

// see setup and usage instructions in lib/task/README.md

export class Tasks extends t.EventEmitter<{
  help(): void;
  updateSupportDeps(): Promise<void>;
  updateDenoDeps(): Promise<void>;
  bundleJsFromTsTwin(): Promise<void>;
  discoverBundleJsFromTsTwin(): Promise<void>;
  discoverJsTargetsWithoutTsTwins(): Promise<void>;
  transformCssFromTsTwin(): Promise<void>;
  discoverTransformCssFromTsTwin(): Promise<void>;
  discoverCssTargetsWithoutTsTwins(): Promise<void>;
  bundleAll(): Promise<void>;
  discoverBundleable(): Promise<void>;
  lintBundleable(): Promise<void>;
  maintain(): Promise<void>;
}> {
  constructor() {
    super();
    // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
    this.on("help", t.eeHelpTask(this));
    this.on(
      "updateSupportDeps",
      gh.ensureGitHubBinary({
        // https://github.com/mergestat/mergestat
        // https://docs.mergestat.com/examples/basic-git
        repo: "mergestat/mergestat",
        destPath: "support/bin",
        release: {
          baseName: "mergestat-linux-amd64.tar.gz",
          unarchive: gh.extractSingleFileFromTarGZ("./mergestat"),
        },
      }),
    );
    this.on("updateDenoDeps", udd.updateDenoDepsTask());
    this.on("bundleJsFromTsTwin", bjs.bundleJsFromTsTwinTask());
    this.on("discoverBundleJsFromTsTwin", bjs.discoverBundleJsFromTsTwinTask());
    this.on(
      "discoverJsTargetsWithoutTsTwins",
      bjs.discoverJsTargetsWithoutTsTwinsTask(),
    );
    this.on("transformCssFromTsTwin", tcss.transformCssFromTsTwinTask());
    this.on(
      "discoverTransformCssFromTsTwin",
      tcss.discoverTransformCssFromTsTwinTask(),
    );
    this.on(
      "discoverCssTargetsWithoutTsTwins",
      tcss.discoverCssTargetsWithoutTsTwinsTask(),
    );
    this.on("bundleAll", async () => {
      await this.emit("bundleJsFromTsTwin");
      await this.emit("transformCssFromTsTwin");
    });
    this.on("discoverBundleable", async () => {
      await this.emit("discoverBundleJsFromTsTwin");
      await this.emit("discoverTransformCssFromTsTwin");
    });
    this.on("lintBundleable", async () => {
      await this.emit("discoverJsTargetsWithoutTsTwins");
      await this.emit("discoverCssTargetsWithoutTsTwins");
    });
    this.on("maintain", async () => {
      await this.emit("updateSupportDeps");
      await this.emit("updateDenoDeps");
      await this.emit("bundleAll");
    });
  }
}

// only execute tasks if Taskfile.ts is being called as a script; otherwise
// it might be imported for tasks or other reasons and we shouldn't "run".
if (import.meta.main) {
  await t.eventEmitterCLI(Deno.args, new Tasks());
}
