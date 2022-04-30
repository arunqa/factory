import * as safety from "../../lib/safety/mod.ts";
import * as govn from "../../governance/mod.ts";
import * as tab from "../../lib/tabular/mod.ts";
import * as oTab from "./tabular.ts";

export const TypicalOriginLifecycleMeasures = [
  "originConstructDurationMS",
  "originMiddlewareDurationMS",
  "originDurationMS",
] as const;

export type OriginMeasures<Identity extends string> = Record<
  Identity,
  number | undefined
>;

export interface MutatableOriginMeasuresSupplier<Measures extends string> {
  originMeasures?: OriginMeasures<Measures>;
}

export type OriginMeasuresSupplier<Measures extends string> = Readonly<
  MutatableOriginMeasuresSupplier<Measures>
>;

export interface MutatableResourceOriginatorSupplier<Originator> {
  originator: Originator;
  originatorTR?: oTab.OriginatorTabularRecord;
}

export type ResourceOriginatorSupplier<Originator> = Readonly<
  MutatableResourceOriginatorSupplier<Originator>
>;

export interface MutatableResourceOriginSupplier<
  Resource,
  Origin extends govn.ResourceFactorySupplier<Resource>,
  TR extends tab.TabularRecordIdSupplier,
> {
  origin: Origin;
  originTR?: TR;
}

export type ResourceOriginSupplier<
  Resource,
  Origin extends govn.ResourceFactorySupplier<Resource>,
  TR extends tab.TabularRecordIdSupplier,
> = Readonly<
  MutatableResourceOriginSupplier<Resource, Origin, TR>
>;

export const isOriginatorSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  ResourceOriginatorSupplier<any>
>(
  "originator",
);

// deno-lint-ignore no-explicit-any
export const isOriginMeasuresSupplier = safety.typeGuard<OriginMeasuresSupplier<any>>(
  "originMeasures",
);

export const isResourceOriginSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  ResourceOriginSupplier<any, any, any>
>(
  "origin",
);
