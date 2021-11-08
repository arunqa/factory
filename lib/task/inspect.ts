import { colors } from "./deps.ts";
import * as govn from "./governance.ts";
import * as id from "./identity.ts";

export const inspect: govn.IdentifiableTaskRunnerSupplier = {
  identity: "inspect",
  // deno-lint-ignore require-await
  exec: async (ctx) => {
    for (const name of Object.keys(ctx.tasks)) {
      const alias = id.camelCaseToKebabTaskName(name);
      console.info(
        colors.gray(
          //deno-fmt-ignore
          `${colors.yellow(name)}${alias != name ? ` or ${colors.yellow(alias)}` : ''} (${colors.gray(Deno.inspect(ctx.tasks[name], {colors: true}))})`,
        ),
      );
    }
  },
};
