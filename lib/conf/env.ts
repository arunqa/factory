import { events, safety } from "../../deps.ts";
import * as govn from "./governance.ts";

export class EnvConfigurationEventsEmitter<Configuration, Context>
  extends events.EventEmitter<{
    searchEnvForProperty(
      // deno-lint-ignore no-explicit-any
      property: ConfigurableEnvVarProperty<Configuration, Context, any>,
      handled: boolean,
      value: unknown,
      envVarName: string,
      envVarValue: string | undefined,
      cpn: govn.ConfigurablePropertyName<Configuration>,
      config: Configuration,
      ctx: Context,
    ): void;
  }> {}

export function envConfigurationEventsConsoleEmitter<
  Configuration,
  Context,
>(verbose = true): EnvConfigurationEventsEmitter<Configuration, Context> {
  const result = new EnvConfigurationEventsEmitter<Configuration, Context>();
  if (verbose) {
    result.on(
      "searchEnvForProperty",
      (_property, handled, value, envVarName, envVarValue, cpn) => {
        const [name, namespace] = propertyName(cpn);
        console.info(
          `Looking for ${envVarName} for property name ${name} (namespace: '${namespace ||
            ""}'): ${
            handled
              ? `found '${envVarValue}' (assigned: ${
                JSON.stringify(value)
              }, type: ${typeof value})`
              : "not found"
          }`,
        );
      },
    );
  }
  return result;
}

export interface ConfigurableEnvVarProperty<Configuration, Context, Value>
  extends govn.ConfigurableProperty<Configuration, Value> {
  readonly populateSync: (
    envVarValue: string,
    c: Configuration,
    ctx: Context,
    ...args: unknown[]
  ) => Value;
  readonly populateDefaultSync?: (
    c: Configuration,
    ctx: Context,
    ...args: unknown[]
  ) => Value;
  readonly populate?: (
    envVarValue: string,
    c: Configuration,
    ctx: Context,
    ...args: unknown[]
  ) => Promise<Value>;
  readonly populateDefault?: (
    c: Configuration,
    ctx: Context,
    ...args: unknown[]
  ) => Promise<Value>;
}

export type ConfigurableEnvVarProperties<Configuration, Context> =
  ConfigurableEnvVarProperty<
    Configuration,
    Context,
    // deno-lint-ignore no-explicit-any
    any
  >[];

export interface ConfigurableEnvVarPropertiesSupplier<Configuration, Context>
  extends govn.ConfigurablePropertiesSupplier<Configuration> {
  readonly properties: ConfigurableEnvVarProperties<Configuration, Context>;
  readonly configGuard?: {
    readonly guard: safety.TypeGuard<Configuration>;
    readonly onGuardFailureSync: (
      supplied: Configuration,
    ) => Configuration;
    readonly onGuardFailure?: (
      supplied: Configuration,
    ) => Promise<Configuration>;
  };
}

export interface ConfigurablePropEnvVarNameStrategy<Configuration, Context> {
  (
    name: govn.ConfigurablePropertyName<Configuration>,
    // deno-lint-ignore no-explicit-any
    property: ConfigurableEnvVarProperty<Configuration, Context, any>,
    config: Configuration,
    ctx: Context,
  ): string;
}

export interface EnvConfigurationContext {
  readonly envVarName: string;
  readonly envVarValue?: string;
}

const camelToSnakeCase = (text: string) =>
  text.replace(/[A-Z]/g, (letter: string) => `_${letter.toUpperCase()}`);

export function propertyName<Configuration>(
  cpn: govn.ConfigurablePropertyName<Configuration>,
): [name: string, namespace: string | undefined] {
  let name: string;
  let namespace: string | undefined = undefined;
  if (typeof cpn === "object") {
    if ("override" in cpn) {
      name = cpn.override;
    } else {
      name = String(cpn.key);
    }
    if ("namespace" in cpn) {
      namespace = cpn.namespace;
    }
  } else {
    name = String(cpn);
  }
  return [name, namespace];
}

/**
 * Environment variable name strategy which upper snake-cases property name
 * @returns NAMESPACE_NAME or PREFIX_NAME if no namespace, with camel case conversion
 */
export function namespacedEnvVarNameUppercase<
  Configuration,
  Context,
>(
  defaultPrefix = "",
): ConfigurablePropEnvVarNameStrategy<Configuration, Context> {
  return (propName) => {
    const [name, namespace] = propertyName(propName);
    return `${
      namespace
        ? `${camelToSnakeCase(namespace).toLocaleUpperCase()}_`
        : defaultPrefix
    }${camelToSnakeCase(name).toLocaleUpperCase()}`;
  };
}

export abstract class EnvConfiguration<Configuration, Context>
  implements govn.ConfigurationSyncSupplier<Configuration, Context> {
  readonly ps: ConfigurableEnvVarPropertiesSupplier<
    Configuration,
    Context
  >;
  constructor(
    properties: (
      ec: EnvConfiguration<Configuration, Context>,
    ) => ConfigurableEnvVarPropertiesSupplier<Configuration, Context>,
    readonly envVarName = namespacedEnvVarNameUppercase<
      Configuration,
      Context
    >(),
    readonly ecee?: EnvConfigurationEventsEmitter<Configuration, Context>,
  ) {
    this.ps = properties(this);
  }

  abstract constructSync(ctx: Context): Configuration;
  abstract unhandledPropertySync(
    p: ConfigurableEnvVarProperty<Configuration, Context, unknown>,
    ctx: Context,
    config: Configuration,
  ): unknown;

  textProperty(
    name: govn.ConfigurablePropertyName<Configuration>,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    populate?: (envVarValue: string, config: Configuration) => string,
  ): ConfigurableEnvVarProperty<Configuration, Context, string> {
    return {
      name,
      aliases,
      populateSync: populate ||
        ((envVarValue, config) => {
          const [mutate] = propertyName(name);
          // deno-lint-ignore no-explicit-any
          (config as any)[mutate] = envVarValue;
          return envVarValue;
        }),
    };
  }

  numericProperty(
    name: govn.ConfigurablePropertyName<Configuration>,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    onGuardFailure?: (o: unknown) => number,
    populate?: (envVarValue: string, config: Configuration) => number,
  ): ConfigurableEnvVarProperty<Configuration, Context, number> {
    const valueGuard = {
      guard: (o: unknown): o is number => {
        if (o && typeof o === "number") return true;
        return false;
      },
      onGuardFailure: onGuardFailure || ((_: unknown) => NaN),
    };
    return {
      name,
      aliases,
      populateSync: populate ||
        ((envVarValue, config) => {
          const [mutate] = propertyName(name);
          const value = parseFloat(envVarValue);
          if (valueGuard.guard(value)) {
            // deno-lint-ignore no-explicit-any
            (config as any)[mutate] = value;
            return value;
          }
          const onFailedValue = valueGuard.onGuardFailure(envVarValue);
          // deno-lint-ignore no-explicit-any
          (config as any)[mutate] = onFailedValue;
          return onFailedValue;
        }),
      valueGuard,
    };
  }

  jsonTextProperty<Type>(
    name: govn.ConfigurablePropertyName<Configuration>,
    guard: safety.TypeGuard<Type>,
    onGuardFailure: (o: unknown, err?: Error) => Type | undefined,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    populate?: (envVarValue: string, config: Configuration) => Type | undefined,
  ): ConfigurableEnvVarProperty<Configuration, Context, Type | undefined> {
    const valueGuard = {
      guard,
      onGuardFailure: onGuardFailure || ((_: unknown) => undefined),
    };
    return {
      name,
      aliases,
      populateSync: populate ||
        ((envVarValue, config) => {
          const [mutate] = propertyName(name);
          try {
            const value = JSON.parse(envVarValue);
            if (guard(value)) {
              // deno-lint-ignore no-explicit-any
              (config as any)[mutate] = value;
              return value;
            }
            const onFailedValue = valueGuard.onGuardFailure(envVarValue);
            // deno-lint-ignore no-explicit-any
            (config as any)[mutate] = onFailedValue;
            return onFailedValue;
          } catch (err) {
            const onFailedValue = valueGuard.onGuardFailure(envVarValue, err);
            // deno-lint-ignore no-explicit-any
            (config as any)[mutate] = onFailedValue;
            return onFailedValue;
          }
        }),
      valueGuard,
    };
  }

  configureSync(ctx: Context, config?: Configuration): Configuration {
    let result = config || this.constructSync(ctx);
    for (const p of this.ps.properties) {
      const tryNames = p.aliases ? [p.name, ...p.aliases] : [p.name];
      let handled = false;
      let value: unknown | undefined;
      for (const tryName of tryNames) {
        const envVarName = this.envVarName(tryName, p, result, ctx);
        const envVarValue = Deno.env.get(envVarName);
        ctx = typeof ctx === "object"
          ? { ...ctx, envVarName, envVarValue }
          : ctx;
        if (envVarValue) {
          value = p.populateSync(envVarValue, result, ctx, envVarName);
          handled = true;
        }
        if (this.ecee) {
          this.ecee.emitSync(
            "searchEnvForProperty",
            p,
            handled,
            value,
            envVarName,
            envVarValue,
            tryName,
            result,
            ctx,
          );
        }
        if (handled) break;
      }
      if (!handled) {
        if (p.populateDefaultSync) {
          p.populateDefaultSync(result, ctx);
        } else {
          this.unhandledPropertySync(p, ctx, result);
        }
      }
    }
    if (this.ps.configGuard) {
      if (!this.ps.configGuard.guard(result)) {
        result = this.ps.configGuard.onGuardFailureSync(result);
      }
    }
    return result;
  }
}

export abstract class AsyncEnvConfiguration<Configuration, Context>
  extends EnvConfiguration<Configuration, Context>
  implements govn.ConfigurationSupplier<Configuration, Context> {
  // deno-lint-ignore require-await
  async construct(ctx: Context): Promise<Configuration> {
    return this.constructSync(ctx);
  }

  // deno-lint-ignore require-await
  async unhandledProperty(
    p: ConfigurableEnvVarProperty<Configuration, Context, unknown>,
    ctx: Context,
    config: Configuration,
  ): Promise<unknown> {
    return this.unhandledPropertySync(p, ctx, config);
  }

  async configure(
    ctx: Context,
    config?: Configuration,
  ): Promise<Configuration> {
    let result = config || await this.construct(ctx);
    for (const p of this.ps.properties) {
      const tryNames = p.aliases ? [p.name, ...p.aliases] : [p.name];
      let handled = false;
      let value: unknown | undefined;
      for (const tryName of tryNames) {
        const envVarName = this.envVarName(tryName, p, result, ctx);
        const envVarValue = Deno.env.get(envVarName);
        ctx = typeof ctx === "object"
          ? { ...ctx, envVarName, envVarValue }
          : ctx;
        if (envVarValue) {
          if (p.populate) {
            value = await p.populate(envVarValue, result, ctx);
          } else {
            value = p.populateSync(envVarValue, result, ctx);
          }
          handled = true;
        }
        if (this.ecee) {
          this.ecee.emitSync(
            "searchEnvForProperty",
            p,
            handled,
            value,
            envVarName,
            envVarValue,
            tryName,
            result,
            ctx,
          );
        }
        if (handled) break;
      }
      if (!handled) {
        if (p.populateDefault) {
          await p.populateDefault(result, ctx);
        } else if (p.populateDefaultSync) {
          p.populateDefaultSync(result, ctx);
        } else {
          await this.unhandledProperty(p, ctx, result);
        }
      }
    }
    if (this.ps.configGuard) {
      if (!this.ps.configGuard.guard(result)) {
        if (this.ps.configGuard.onGuardFailure) {
          result = await this.ps.configGuard.onGuardFailure(result);
        } else {
          result = this.ps.configGuard.onGuardFailureSync(result);
        }
      }
    }
    return result;
  }
}
