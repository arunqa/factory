import * as safety from "../../lib/safety/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as tab from "./tabular.ts";

export interface MutatableResourceOriginatorSupplier<Originator> {
  originator: Originator;
  originatorTR?: tab.OriginatorTabularRecord;
}

export type ResourceOriginatorSupplier<Originator> = Readonly<
  MutatableResourceOriginatorSupplier<Originator>
>;

export interface MutatableResourceOriginSupplier<
  Resource,
  Origin extends govn.ResourceFactorySupplier<Resource>,
> {
  origin: Origin;
}

export type ResourceOriginSupplier<
  Resource,
  Origin extends govn.ResourceFactorySupplier<Resource>,
> = Readonly<
  MutatableResourceOriginSupplier<Resource, Origin>
>;

export const isOriginatorSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  ResourceOriginatorSupplier<any>
>(
  "originator",
);

export const isResourceOriginSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  ResourceOriginSupplier<any, any>
>(
  "origin",
);
