import * as govn from "../../governance/mod.ts";

const controlPanelRouteUnit: govn.RouteUnit = {
  unit: "control-panel",
  label: "Control Panel",
};

const observabilityUnitName = "observability";
const observabilityRouteUnit: govn.RouteUnit = {
  unit: observabilityUnitName,
  label: "Observability",
};

const diagnosticsRouteUnit: govn.RouteUnit = {
  unit: "diagnostics",
  label: "Diagnostics",
  aliases: ["../"], // the control panel index should be this unit
};

const observabilityRouteUnits: govn.RouteUnits = {
  units: [controlPanelRouteUnit, observabilityRouteUnit],
  terminal: observabilityRouteUnit,
};

const diagnosticsRouteUnits: govn.RouteUnits = {
  units: [controlPanelRouteUnit, diagnosticsRouteUnit],
  terminal: diagnosticsRouteUnit,
};

const diagnosticsObsRedirectRouteTerminal:
  & govn.RouteUnit
  & govn.RedirectUrlSupplier = {
    ...observabilityRouteUnit,
    redirect: `../../${observabilityUnitName}/`, // will work for pretty URLs only
  };
const diagnosticsObsRedirectRouteUnits: govn.RouteUnits = {
  units: [
    controlPanelRouteUnit,
    diagnosticsRouteUnit,
    diagnosticsObsRedirectRouteTerminal,
  ],
  terminal: diagnosticsObsRedirectRouteTerminal,
};

export function observabilityRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(observabilityRouteUnits);
}

export function diagnosticsRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(diagnosticsRouteUnits);
}

export function diagnosticsObsRedirectRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(diagnosticsObsRedirectRouteUnits);
}
