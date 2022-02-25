import * as rflTask from "./lib/task/mod.ts";

// see setup and usage instructions in lib/task/README.md

await rflTask.run(Deno.args, {
  ...rflTask.defaultTasks,
});
