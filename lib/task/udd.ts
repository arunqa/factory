import { colors, fs, udd } from "./deps.ts";

export function updateDenoDepsTask() {
  return async () => {
    for await (const we of fs.walk(".", { includeDirs: false })) {
      if (we.name.endsWith(".ts")) {
        console.log(
          colors.dim(`Updating Deno dependencies in ${colors.gray(we.path)}`),
        );
        await udd.udd(we.path, { quiet: true });
      }
    }
  };
}
