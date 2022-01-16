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

export interface Expression<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type ExpressionsSupplier<T> = Iterables<T>;

export interface Purpose<Namespace extends string> {
  readonly identity: StrategyIdentitySupplier<Namespace>;
}

export type PurposesSupplier<T> = Iterables<T>;
