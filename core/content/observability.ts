import * as govn from "../../governance/mod.ts";

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

export function observabilityRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(observabilityRouteUnits);
}
