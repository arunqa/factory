import * as t from "./lib/task/core.ts";
import * as tcss from "./lib/task/transform-css.ts";
import * as bjs from "./lib/task/bundle-js.ts";
import * as udd from "./lib/task/udd.ts";

// see setup and usage instructions in lib/task/README.md

export class Tasks extends t.EventEmitter<{
  help(): void;
  updateDenoDeps(): Promise<void>;
  bundleJsFromTsTwin(): Promise<void>;
  discoverBundleJsFromTsTwin(): Promise<void>;
  transformCssFromTsTwin(): Promise<void>;
  discoverTransformCssFromTsTwinTask(): Promise<void>;
  bundleAll(): Promise<void>;
  discoverBundleable(): Promise<void>;
  maintain(): Promise<void>;
}> {
  constructor() {
    super();
    // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
    this.on("help", t.eeHelpTask(this));
    this.on("updateDenoDeps", udd.updateDenoDepsTask());
    this.on("bundleJsFromTsTwin", bjs.bundleJsFromTsTwinTask());
    this.on("discoverBundleJsFromTsTwin", bjs.discoverBundleJsFromTsTwinTask());
    this.on("transformCssFromTsTwin", tcss.transformCssFromTsTwinTask());
    this.on(
      "discoverTransformCssFromTsTwinTask",
      tcss.discoverTransformCssFromTsTwinTask(),
    );
    this.on("bundleAll", async () => {
      await this.emit("bundleJsFromTsTwin");
      await this.emit("transformCssFromTsTwin");
    });
    this.on("discoverBundleable", async () => {
      await this.emit("discoverBundleJsFromTsTwin");
      await this.emit("discoverTransformCssFromTsTwinTask");
    });
    this.on("maintain", async () => {
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
