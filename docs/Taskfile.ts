// see:
// * https://dev.to/vonheikemen/a-simple-way-to-replace-npm-scripts-in-deno-4j0g
// * https://dev.to/vonheikemen/extending-the-deno-cli-using-a-shell-function-3ifh
// * https://github.com/brianboyko/denodash/blob/main/Taskfile.ts

// setup:
// * alias deno-task='deno run --allow-run $(git rev-parse --show-toplevel)/Taskfile.ts'

// logging:
// * consider using Deno loggers

type DenoTask = (...args: unknown[]) => Promise<Deno.ProcessStatus>;

function run([name, ...args]: string[], tasks: Record<string, DenoTask>): void {
  if (tasks[name]) {
    tasks[name](...args);
  } else {
    console.log(`Task "${name}" not found`);
  }
}

async function exec(args: string[]): Promise<Deno.ProcessStatus> {
  const proc = await Deno.run({ cmd: args }).status();

  if (proc.success == false) {
    Deno.exit(proc.code);
  }

  return proc;
}

run(Deno.args, {
  test: () => exec(`deno test --allow-env`.split(" ")),
  docs: () =>
    exec(
      `deno run --allow-read --allow-write documentation/createDocumentation.ts`
        .split(
          " ",
        ),
    ),
  fmt: () => exec(`deno fmt`.split(" ")),
});
