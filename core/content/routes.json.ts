import * as govn from "../../governance/mod.ts";
import * as r from "../std/route.ts";
import * as jr from "../render/json.ts";

// hide properties that could have circular references which will break JSON.stringify()
export const routeTreeJsonReplacer = (key: string, value: unknown) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      size: value.size,
      keys: Array.from(value.keys()),
    };
  } else {
    if (key == "terminal" && r.isRouteNode(value)) {
      return value.qualifiedPath;
    }
    if (key == "parent") {
      if (r.isRouteNode(value)) {
        return value.qualifiedPath;
      }
      if (r.isRoute(value) && value.terminal) {
        return value.terminal.qualifiedPath;
      }
    }
    if (key == "redirect") {
      if (r.isRedirectUrlSupplier(value)) return value.redirect;
      if (r.isRedirectNodeSupplier(value)) return value.redirect.qualifiedPath;
    }
    if (key == "ancestors" && Array.isArray(value)) {
      const ancestors = value as govn.RouteNode[];
      return ancestors.map((a) => a.qualifiedPath);
    }
    return ["owner", "ldsNavNotification", "route"].find((name) => name == key)
      ? undefined // these can be circular, omit them
      : value;
  }
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
// deno-lint-ignore require-await
export const jsonRoutesProducer: jr.JsonTextProducer<unknown> = async (
  layout,
) => {
  return {
    jsonText: JSON.stringify(layout.routeTree, routeTreeJsonReplacer, "  "),
  };
};
