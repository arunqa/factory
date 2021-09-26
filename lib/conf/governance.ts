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

export interface NamespacedConfigurablePropertyName<Configuration> {
  readonly key: keyof Configuration;
  readonly namespace: string;
}

export interface UntypedConfigurablePropertyName {
  readonly override: string;
  readonly namespace?: string;
}

export type ConfigurablePropertyName<Configuration> =
  | keyof Configuration
  | NamespacedConfigurablePropertyName<Configuration>
  | UntypedConfigurablePropertyName;

// TODO: allow "secrets" (e.g. encrypted values), see GSH Vault
export interface ConfigurableProperty<Configuration, Value> {
  readonly name: ConfigurablePropertyName<Configuration>;
  readonly aliases?: ConfigurablePropertyName<Configuration>[];
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
