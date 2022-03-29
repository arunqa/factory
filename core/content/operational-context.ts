import * as govn from "../../governance/mod.ts";
import * as r from "../std/route.ts";
import * as safety from "../../lib/safety/mod.ts";

export interface OperationalCtxRouteUnit {
  readonly isOperationalCtxRouteUnit: true;
}

export const isOperationalCtxRouteUnit = safety.typeGuard<
  OperationalCtxRouteUnit
>("isOperationalCtxRouteUnit");

const operationalCtxRouteUnit: govn.RouteUnit & OperationalCtxRouteUnit = {
  isOperationalCtxRouteUnit: true,
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

export function isOperationalCtxRoute(
  rs: govn.RouteSupplier | govn.Route,
): boolean {
  const route = r.isRouteSupplier(rs) ? rs.route : rs;
  return route.units.find((u) => isOperationalCtxRouteUnit(u)) ? true : false;
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
