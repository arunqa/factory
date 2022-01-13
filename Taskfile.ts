import * as rflTask from "./lib/task/mod.ts";

// setup:
// * alias deno-task='deno run --allow-run $(git rev-parse --show-toplevel)/Taskfile.ts'
// run:
// deno-task inspect

await rflTask.run(Deno.args, {
  ...rflTask.defaultTasks,
});
