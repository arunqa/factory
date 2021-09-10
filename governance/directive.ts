export type DirectiveIdentity = string;

export interface DirectiveExpectation<Directive, EncounteredResult> {
  readonly identity: DirectiveIdentity;
  readonly encountered: (
    d: Directive,
  ) => EncounteredResult;
}

export interface DirectiveExpectationsSupplier<
  // deno-lint-ignore no-explicit-any
  DE extends DirectiveExpectation<any, any>,
> {
  readonly allowedDirectives: () => Iterable<DE>;
}
