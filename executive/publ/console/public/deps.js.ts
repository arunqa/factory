/**
 * deps.js.ts is a Typescript-friendly Deno-style strategy of bringing in
 * selective server-side Typescript functions and modules into client-side
 * browser and other user agent Javascript. deps.js.ts should be Deno bundled
 * into deps.js -- HTML and client-side source pulls in deps.js but since it's
 * bundled / generated from this file we know it will be correct.
 */

export * from "../../../../lib/text/human.ts";
export * from "../../../../lib/text/whitespace.ts";
