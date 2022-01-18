import * as id from "../identity/mod.ts";

export interface StrategyIdentitySupplier<Namespace extends string> {
  readonly UUID: id.NamespacedIdentity<Namespace>;
  readonly humanFriendlyID?: id.HumanFriendlyIdentity;
}

export type Iterables<T> = {
  [P in keyof T as `${string & P}s`]: Iterable<T[P]>;
};

export interface Intention<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type IntentionsSupplier<T> = Iterables<T>;

export interface Expectation<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type ExpectationsSupplier<T> = Iterables<T>;

export interface Instrumentable<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export interface InstrumentableExpectation<Namespace extends string>
  extends Instrumentable<Namespace>, Expectation<Namespace> {
}

export interface Demand<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type DemandsSupplier<T> = Iterables<T>;

export interface Initiative<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type InitiativesSupplier<T> = Iterables<T>;

export interface Deliverable<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type DeliverablesSupplier<T> = Iterables<T>;

export interface MilestoneText extends String {
  // see [nominal typing](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-interfaces)
  readonly _milestoneTextBrand: string; // To prevent type errors that could mix strings
}

export interface Milestone<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
  readonly milestone: MilestoneText;
  readonly initiate: Date;
  readonly terminate?: Date;
}

export type MilestonesSupplier<T> = Iterables<T>;
