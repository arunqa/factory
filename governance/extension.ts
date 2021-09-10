export interface ExtensionExportsFilter {
  (key: string, value: unknown): boolean;
}

// deno-lint-ignore no-empty-interface
export interface UntypedExports extends Record<string, unknown> {
}

export interface ExtensionModule {
  readonly isValid: boolean;
  readonly provenance: string | URL;
  readonly module: unknown;
  readonly exports: <Export = UntypedExports>(
    assign?: ExtensionExportsFilter,
  ) => Export;
  readonly importError?: Error;
}

export interface ExtensionConsumer {
  readonly potentialModules: () => Iterable<string>;
  readonly consumeModule: (im: ExtensionModule) => Promise<ExtensionModule>;
}

export interface ExtensionsSupplier {
  readonly extensions: Iterable<ExtensionModule>;
}

export interface ExtensionsManager {
  readonly extensions: Iterable<ExtensionModule>;
  readonly importModule: (name: string) => Promise<ExtensionModule>;
  readonly extend: (...ec: ExtensionConsumer[]) => Promise<void>;
}
