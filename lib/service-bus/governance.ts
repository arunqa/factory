export type PayloadIdentity = string;

export interface IdentifiablePayload {
  readonly payloadIdentity: PayloadIdentity; // use by observers
}

export interface ErrorSupplier {
  readonly error: Error;
}

export interface EventTargetEventNameStrategy {
  (payload: PayloadIdentity | IdentifiablePayload | "universal"): string;
}
