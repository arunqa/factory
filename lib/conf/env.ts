import { safety } from "../../deps.ts";
import * as govn from "./governance.ts";

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
  return (p) => {
    const name = typeof p.name === "object" ? p.name.override : String(p.name);
    return `${
      p.namespace
        ? `${camelToSnakeCase(p.namespace).toLocaleUpperCase()}_`
        : defaultPrefix
    }${camelToSnakeCase(name).toLocaleUpperCase()}`;
  };
}

/**
 * Environment variable name strategy which upper snake-cases property name
 * @returns PREFIX_NAME, with camel case conversion of name
 */
export function prefixedEnvVarNameUppercase<
  Configuration,
  Context,
>(prefix: string): ConfigurablePropEnvVarNameStrategy<Configuration, Context> {
  return (p) => {
    const name = typeof p.name === "object" ? p.name.override : String(p.name);
    return `${prefix}}${camelToSnakeCase(name).toLocaleUpperCase()}`;
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
  ) {
    this.ps = properties(this);
  }

  abstract constructSync(ctx: Context): Configuration;
  abstract unhandledPropertySync(
    p: ConfigurableEnvVarProperty<Configuration, Context, unknown>,
    ctx: Context,
    config: Configuration,
    envVarName: string,
    envVarValue?: string,
  ): unknown;

  textProperty(
    name: keyof Configuration | {
      readonly name: keyof Configuration;
      readonly namespace: string;
    },
    populate?: (envVarValue: string, config: Configuration) => string,
  ): ConfigurableEnvVarProperty<Configuration, Context, string> {
    return {
      name: typeof name === "object" ? name.name : name,
      namespace: typeof name === "object" ? name.namespace : undefined,
      populateSync: populate ||
        ((envVarValue, config) => {
          // deno-lint-ignore no-explicit-any
          (config as any)[name] = envVarValue;
          return envVarValue;
        }),
    };
  }

  numericProperty(
    name: keyof Configuration | {
      readonly name: keyof Configuration;
      readonly namespace: string;
    },
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
      name: typeof name === "object" ? name.name : name,
      namespace: typeof name === "object" ? name.namespace : undefined,
      populateSync: populate ||
        ((envVarValue, config) => {
          const value = parseFloat(envVarValue);
          if (valueGuard.guard(value)) {
            // deno-lint-ignore no-explicit-any
            (config as any)[name] = value;
            return value;
          }
          const onFailedValue = valueGuard.onGuardFailure(envVarValue);
          // deno-lint-ignore no-explicit-any
          (config as any)[name] = onFailedValue;
          return onFailedValue;
        }),
      valueGuard,
    };
  }

  jsonTextProperty<Type>(
    name: keyof Configuration | {
      readonly name: keyof Configuration;
      readonly namespace: string;
    },
    guard: safety.TypeGuard<Type>,
    onGuardFailure: (o: unknown, err?: Error) => Type | undefined,
    populate?: (envVarValue: string, config: Configuration) => Type | undefined,
  ): ConfigurableEnvVarProperty<Configuration, Context, Type | undefined> {
    const valueGuard = {
      guard,
      onGuardFailure: onGuardFailure || ((_: unknown) => undefined),
    };
    return {
      name: typeof name === "object" ? name.name : name,
      namespace: typeof name === "object" ? name.namespace : undefined,
      populateSync: populate ||
        ((envVarValue, config) => {
          try {
            const value = JSON.parse(envVarValue);
            if (guard(value)) {
              // deno-lint-ignore no-explicit-any
              (config as any)[name] = value;
              return value;
            }
            const onFailedValue = valueGuard.onGuardFailure(envVarValue);
            // deno-lint-ignore no-explicit-any
            (config as any)[name] = onFailedValue;
            return onFailedValue;
          } catch (err) {
            const onFailedValue = valueGuard.onGuardFailure(envVarValue, err);
            // deno-lint-ignore no-explicit-any
            (config as any)[name] = onFailedValue;
            return onFailedValue;
          }
        }),
      valueGuard,
    };
  }

  configureSync(ctx: Context, config?: Configuration): Configuration {
    let result = config || this.constructSync(ctx);
    for (const p of this.ps.properties) {
      const envVarName = this.envVarName(p, result, ctx);
      const envVarValue = Deno.env.get(envVarName);
      ctx = typeof ctx === "object" ? { ...ctx, envVarName, envVarValue } : ctx;
      if (envVarValue) {
        p.populateSync(envVarValue, result, ctx, envVarName);
      } else if (p.populateDefaultSync) {
        p.populateDefaultSync(result, ctx, envVarName);
      } else {
        this.unhandledPropertySync(p, ctx, result, envVarName, envVarValue);
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
    envVarName: string,
    envVarValue?: string,
  ): Promise<unknown> {
    return this.unhandledPropertySync(p, ctx, config, envVarName, envVarValue);
  }

  async configure(
    ctx: Context,
    config?: Configuration,
  ): Promise<Configuration> {
    let result = config || await this.construct(ctx);
    for (const p of this.ps.properties) {
      const envVarName = this.envVarName(p, result, ctx);
      const envVarValue = Deno.env.get(envVarName);
      ctx = typeof ctx === "object" ? { ...ctx, envVarName, envVarValue } : ctx;
      if (envVarValue) {
        if (p.populate) {
          await p.populate(envVarValue, result, ctx, envVarName);
        } else {
          p.populateSync(envVarValue, result, ctx, envVarName);
        }
      } else {
        if (p.populateDefault) {
          await p.populateDefault(result, ctx, envVarName);
        } else if (p.populateDefaultSync) {
          p.populateDefaultSync(result, ctx, envVarName);
        } else {
          await this.unhandledProperty(p, ctx, result, envVarName, envVarValue);
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
