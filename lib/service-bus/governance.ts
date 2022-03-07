import * as safety from "../safety/mod.ts";

export type PayloadIdentity = string;

export interface IdentifiablePayload {
  readonly payloadIdentity: PayloadIdentity; // use by observers
}

export const isIdentifiablePayload = safety.typeGuard<IdentifiablePayload>(
  "payloadIdentity",
);

export interface ErrorSupplier {
  readonly error: Error;
}

export interface EventTargetEventNameStrategy {
  (payload: PayloadIdentity | IdentifiablePayload | "universal"): {
    readonly payloadSpecificName?: string;
    readonly universalName: string;
    readonly selectedName: string;
  };
}
