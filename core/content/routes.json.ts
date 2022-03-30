import * as jr from "../render/json.ts";
import "https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js";

declare global {
  // https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js
  interface JSON {
    decycle: (o: unknown) => unknown;
    retrocycle: (o: unknown) => unknown;
  }
}

export const mapToObjectJsonReplacer = (_key: string, value: unknown) => {
  if (value instanceof Map) {
    // deno-lint-ignore no-explicit-any
    return Array.from(value).reduce((obj: any, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  } else {
    return value;
  }
};

export const typicalSerializedJSON = (value: unknown, options?: {
  readonly decycle?: boolean;
  readonly transformMapsToObjects?: boolean;
}) => {
  const { decycle, transformMapsToObjects } = options ?? {};
  return JSON.stringify(
    decycle ? JSON.decycle(value) : value,
    transformMapsToObjects ? mapToObjectJsonReplacer : undefined,
  );
};

/**
 * Use jsonRoutesProducer to generate JSON as part of a file system origination
 * source instead of directly as originators. For example, you can create
 * something like this:
 *
 * content/
 *   observability/
 *     routes.json.ts
 *
 * And in routes.json.ts you would have:
 *   import * as routes from "../../core/content/routes.json.ts";
 *   export default routes.jsonRoutesProducer;
 *
 * The above would allow you move the resources anywhere just by setting up the right
 * files.
 *
 * @param layout JSON layout context will be passed in during text emit
 * @returns JsonTextSupplier with the content
 */
export const jsonRoutesProducer: jr.StructuredDataTextProducer<unknown> =
  // deno-lint-ignore require-await
  async (
    layout,
  ) => {
    return {
      serializedData: typicalSerializedJSON(layout.routeTree, {
        decycle: true,
        transformMapsToObjects: true,
      }),
    };
  };
