import { colors, fs, udd } from "./deps.ts";
import * as govn from "./governance.ts";

export const updateDenoDeps: govn.IdentifiableTaskRunnerSupplier = {
  identity: "update-deno-deps",
  exec: async (_ctx) => {
    for await (
      const we of fs.walk(".", { includeDirs: false })
    ) {
      if (we.name.endsWith(".ts")) {
        console.log(
          colors.dim(`Updating Deno dependencies in ${colors.gray(we.path)}`),
        );
        await udd.udd(we.path, { quiet: true });
      }
    }
  },
};
