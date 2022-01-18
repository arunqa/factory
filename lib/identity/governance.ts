export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type Identity = UUID;

export interface HumanFriendlyIdentity extends String {
  // see [nominal typing](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-interfaces)
  readonly _humanFriendlyIdBrand: string; // To prevent type errors that could mix strings
}

export interface IdentityFactory {
  readonly randomID: () => Identity;
}

export type NamespacedIdentity<NS extends string> = `${NS}::${Identity}`;

export interface NamespacedIdentityFactory<Namespace extends string>
  extends IdentityFactory {
  readonly randomNamespacedID: () => NamespacedIdentity<Namespace>;
  readonly idempotentNamespacedID: (
    deriveFrom: string,
  ) => Promise<NamespacedIdentity<Namespace>>;
}
