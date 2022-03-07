/**
 * service-bus_test.js.ts is a Typescript-friendly Deno-style strategy of bringing
 * in selective server-side Typescript functions and modules into client-side
 * browser and other user agent Javascript. flexible-args.ts can work in any
 * Typescript runtime and service-bus_test.js.ts allows the same for browsers.
 *
 * REMINDER: service-bus_test.auto.js must exist in order for service-bus_test.js.ts to
 *           be bundled by Taskfile.ts. If it doesn't exist just create a empty file named
 *           service-bus_test.auto.js.
 */

export * from "../../conf/flexible-args.ts";
export * from "../../service-bus/mod.ts";
export * from "../../service-bus/binary-state-proxy.ts";
export * from "./block.ts";
