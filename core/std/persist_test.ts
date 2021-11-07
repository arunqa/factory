import { testingAsserts as ta } from "../deps-test.ts";
import * as govn from "../../governance/mod.ts";
import * as r from "./route.ts";
import * as mod from "./persist.ts";

const root1: govn.RouteUnit = {
  unit: "home",
  label: "Home",
};

const module2: govn.RouteUnit = {
  unit: "module2",
  label: "Module 2",
};

const m2Component1: govn.RouteUnit = {
  unit: "component1",
  label: "Module 2 Component 1",
};

const m2Component1Index: govn.RouteUnit = {
  unit: "index",
  label: "Module 2 Component 1 Service 1",
};

const m2Component1Service1: govn.RouteUnit = {
  unit: "service1",
  label: "Module 2 Component 1 Service 1",
};

Deno.test(`route file destinations`, () => {
  const routeFactory = new r.TypicalRouteFactory(
    r.defaultRouteLocationResolver(),
    r.defaultRouteWorkspaceEditorResolver(() => undefined),
  );
  const homeRoute: govn.RouteUnits = { units: [root1] };
  const module2Route: govn.RouteUnits = {
    units: [...homeRoute.units, module2],
  };
  const m2Component1Route: govn.RouteUnits = {
    units: [...module2Route.units, m2Component1],
  };
  const m2Component1Service1Route: govn.RouteUnits = {
    units: [
      ...m2Component1Route.units,
      m2Component1Service1,
    ],
  };

  const route = routeFactory.route(m2Component1Service1Route);
  ta.assert(route.terminal);
  ta.assertEquals(
    route.terminal.location(),
    "/home/module2/component1/service1",
  );
  ta.assertEquals(
    route.terminal.location({ base: "/base" }),
    "/base/home/module2/component1/service1",
  );

  const routeSupplier = { route: route };
  const htmlNS = mod.routePersistForceExtnNamingStrategy(".html");
  ta.assertEquals(
    htmlNS(routeSupplier, "/dest/base"),
    "/dest/base/home/module2/component1/service1.html",
  );

  const prettyNS = mod.routePersistPrettyUrlHtmlNamingStrategy((ru) =>
    ru.unit === "index"
  );
  ta.assertEquals(
    prettyNS(routeSupplier, "/dest/base"),
    "/dest/base/home/module2/component1/service1/index.html",
  );
  ta.assertEquals(
    prettyNS({
      route: routeFactory.route({
        units: [
          ...m2Component1Route.units,
          m2Component1Index,
        ],
      }),
    }, "/dest/base"),
    "/dest/base/home/module2/component1/index.html",
  );
});

Deno.test(`bad routes destinations`, () => {
  const htmlNS = mod.routePersistForceExtnNamingStrategy(".html");
  ta.assertEquals(
    htmlNS(r.emptyRouteSupplier, "/base"),
    "no_terminal_route_in_routePersistForceExtnNamingStrategy.html",
  );

  const prettyNS = mod.routePersistPrettyUrlHtmlNamingStrategy((ru) =>
    ru.unit === "index"
  );
  ta.assertEquals(
    prettyNS(r.emptyRouteSupplier, "/base"),
    "no_terminal_route_in_routePersistPrettyUrlHtmlNamingStrategy.html",
  );
});
