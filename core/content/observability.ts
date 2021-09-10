import * as govn from "../../governance/mod.ts";
import * as route from "../std/route.ts";

const controlPanelRouteUnit: govn.RouteUnit = {
  unit: ".control-panel",
  label: "Control Panel",
};

const observabilityRouteUnit: govn.RouteUnit = {
  unit: "observability",
  label: "Observability",
};

const observabilityRouteUnits: govn.RouteUnits = {
  units: [controlPanelRouteUnit, observabilityRouteUnit],
  terminal: observabilityRouteUnit,
};

export const observabilityRoute = route.route(observabilityRouteUnits);
