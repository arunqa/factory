/**
 * deps.js.ts is a Typescript-friendly Deno-style strategy of bringing in
 * selective server-side Typescript functions and modules into client-side
 * browser and other user agent Javascript runtimes.
 *
 * deps.js.ts should be Deno bundled into deps.auto.js assuming that
 * deps.auto.js exists as a "twin". The existence of the deps.auto.js (even an
 * empty one) is a signal to the bundler to generate the twin *.auto.js file.
 * HTML and client-side source pulls in *.auto.js but since it's generated from
 * this file we know it will be correct.
 *
 * REMINDER: deps.auto.js must exist in order for deps.js.ts to be bundled.
 *           if it doesn't exist just create a empty file named deps.auto.js
 */

export * from "../../../../../../lib/text/human.ts";
export * from "https://unpkg.com/effector@22.3.0/effector.mjs";
export * from "../../workspace/ua-editable.ts";

import { createDomain } from "https://unpkg.com/effector@22.3.0/effector.mjs";

// TODO[essential]: figure out how to properly type createDomain in Deno
// deno-lint-ignore no-explicit-any
export const projectDomain: any = createDomain("project");
export const projectInitFx = projectDomain.createEffect(async () =>
  (await fetch("/publication/inspect/project.json")).json()
);

// TODO[essential,governance]: type the Project in publication-middleware.ts and use it here
export const $project = projectDomain.createStore(null).on(
  projectInitFx.doneData,
  (_: unknown, project: Record<string, unknown>) => project,
);
