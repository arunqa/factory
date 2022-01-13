import * as govn from "./governance.ts";
import * as i from "./inspect.ts";
import * as udd from "./udd.ts";

export const defaultTasks: govn.Tasks = {
  [i.inspect.identity]: i.inspect,
  [udd.updateDenoDeps.identity]: udd.updateDenoDeps,
};
