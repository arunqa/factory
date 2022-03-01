/**
 * universal.js.ts is a Typescript-friendly Deno-style strategy of bringing in
 * selective server-side Typescript functions and modules into client-side
 * browser and other user agent Javascript.
 *
 * universal.js.ts should be Deno bundled into universal.auto.js assuming that
 * universal.auto.js exists as a "twin". The existence of the universal.auto.js
 * (even an empty one) is a signal to the bundler to generate the *.auto.js file.
 * HTML and client-side source pulls in *.auto.js but since it's generated from
 * this file we know it will be correct.
 *
 * REMINDER: universal.auto.js must exist in order for universal.js.ts to be
 * bundled.
 */

export * from "../../../../../lib/conf/flexible-args.ts";
export * from "../../../../../lib/net/http-endpoint-action.js";
export * from "../../../../../lib/dom/tunnels.js";
