import { safety } from "../../deps.ts";

export interface ConfigurationSupplier<Configuration, Context> {
  readonly configure: (
    ctx: Context,
    config?: Configuration,
  ) => Promise<Configuration>;
}

export interface ConfigurationSyncSupplier<Configuration, Context> {
  readonly configureSync: (
    ctx: Context,
    config?: Configuration,
  ) => Configuration;
}

export type ConfigurablePropertyName<Configuration> = keyof Configuration | {
  readonly override: string;
};

// TODO: allow "secrets" (e.g. encrypted values), see GSH Vault
export interface ConfigurableProperty<Configuration, Value> {
  readonly name: ConfigurablePropertyName<Configuration>;
  readonly namespace?: string;
  readonly valueGuard?: {
    readonly guard: safety.TypeGuard<Value>;
    readonly onGuardFailure: (supplied: unknown, exception?: Error) => Value;
  };
}

export type ConfigurableProperties<Configuration> = ConfigurableProperty<
  Configuration,
  // deno-lint-ignore no-explicit-any
  any
>[];

export interface ConfigurablePropertiesSupplier<Configuration> {
  readonly properties: ConfigurableProperties<Configuration>;
}
