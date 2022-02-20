import * as govn from "../../governance/mod.ts";

const operationalCtxRouteUnit: govn.RouteUnit = {
  unit: "operational-context",
  label: "Operational Context",
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
  units: [operationalCtxRouteUnit, observabilityRouteUnit],
  terminal: observabilityRouteUnit,
};

const diagnosticsRouteUnits: govn.RouteUnits = {
  units: [operationalCtxRouteUnit, diagnosticsRouteUnit],
  terminal: diagnosticsRouteUnit,
};

const diagnosticsObsRedirectRouteTerminal: govn.RouteUnit = {
  ...observabilityRouteUnit,
  location: () => {
    return `../../${observabilityUnitName}/`;
  },
};

const diagnosticsObsRedirectRouteUnits: govn.RouteUnits = {
  units: [
    operationalCtxRouteUnit,
    diagnosticsRouteUnit,
    diagnosticsObsRedirectRouteTerminal,
  ],
  terminal: diagnosticsObsRedirectRouteTerminal,
};

export function operationalCtxRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(operationalCtxRouteUnit);
}

export function observabilityRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(observabilityRouteUnits);
}

export function diagnosticsRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(diagnosticsRouteUnits);
}

export function diagnosticsObsRedirectRoute(rf: govn.RouteFactory): govn.Route {
  return rf.route(diagnosticsObsRedirectRouteUnits);
}
