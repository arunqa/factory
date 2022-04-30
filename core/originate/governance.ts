import * as safety from "../../lib/safety/mod.ts";

export interface MutatableOriginatorSupplier<Originator> {
  originator: Originator;
}

export type OriginatorSupplier<Originator> = Readonly<
  MutatableOriginatorSupplier<Originator>
>;

export interface MutatableReconstructOriginSupplier<Resource> {
  reconstructFromOrigin: () => Promise<Resource>;
}

export type ReconstructOriginSupplier<Resource> = Readonly<
  MutatableReconstructOriginSupplier<Resource>
>;

export const isOriginatorSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  OriginatorSupplier<any>
>("originator");

export const isReconstructOriginSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  ReconstructOriginSupplier<any>
>("reconstructFromOrigin");
