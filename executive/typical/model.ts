import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";

export function modelRouteUnit(label: string): rfGovn.RouteUnit {
  return {
    unit: "model.json",
    label,
  };
}

export async function modelResource<Model>({ model, nature, route }: {
  readonly model: (route: rfGovn.Route) => Promise<Model> | Model;
  readonly nature: typeof rfStd.jsonContentNature;
  readonly route: rfGovn.Route;
}) {
  const instance = await model(route);
  const jsonText = JSON.stringify(instance, undefined, "  ");
  const result:
    & rfGovn.StructuredDataInstanceSupplier<Model>
    & rfGovn.PersistableStructuredDataResource
    & rfGovn.RouteSupplier = {
      nature,
      route,
      structuredDataInstance: instance,
      serializedData: {
        // deno-lint-ignore require-await
        text: async () => jsonText,
        textSync: () => jsonText,
      },
    };
  return result;
}
