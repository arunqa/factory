import * as rflTask from "./lib/task/mod.ts";

// see setup and usage instructions in lib/task/README.md

// only execute tasks if Taskfile.ts is being called as a script; otherwise
// it might be imported for tasks or other reasons and we shouldn't "run".
if (import.meta.main) {
  await rflTask.run(Deno.args, {
    ...rflTask.defaultTasks,
  });
}
