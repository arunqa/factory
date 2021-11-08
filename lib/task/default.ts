import * as govn from "./governance.ts";
import * as i from "./inspect.ts";

export const defaultTasks: govn.Tasks = {
  [i.inspect.identity]: i.inspect,
};
