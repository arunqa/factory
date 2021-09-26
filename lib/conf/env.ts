import { events, safety } from "../../deps.ts";
import * as govn from "./governance.ts";

export class EnvConfigurationEventsEmitter<Configuration, Context>
  extends events.EventEmitter<{
    searchEnvForProperty(
      handled: boolean,
      // this event handler can get both handled and unhandled properties so
      // cevpp has optional envVarValue since it may not be available
      cevpp:
        & Omit<
          // deno-lint-ignore no-explicit-any
          ConfigurableEnvVarPropertyPopulate<Configuration, any, Context>,
          "envVarValue"
        >
        & Partial<
          Pick<
            // deno-lint-ignore no-explicit-any
            ConfigurableEnvVarPropertyPopulate<Configuration, any, Context>,
            "envVarValue"
          >
        >,
      cpn: govn.ConfigurablePropertyName<Configuration>,
      value: unknown,
    ): void;
    envPropertyNotHandled(
      p: ConfigurableEnvVarProperty<Configuration, unknown, Context>,
      config: Configuration,
      ps: ConfigurableEnvVarPropertiesSupplier<Configuration, Context>,
      ctx?: Context,
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
      (handled, { envVarName, envVarValue }, cpn, value) => {
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

    result.on(
      "envPropertyNotHandled",
      (property, _ps, _config, _ctx) => {
        const [name, namespace] = propertyName(property.name);
        console.info(
          // deno-fmt-ignore
          `Property name ${name} (namespace: '${namespace || ""}') was not handled`,
        );
      },
    );
  }
  return result;
}

export interface ConfigurableEnvVarPropertyPopulate<
  Configuration,
  Value,
  Context,
> extends govn.ConfigurablePropertyPopulate<Configuration, Value, Context> {
  readonly property: ConfigurableEnvVarProperty<Configuration, Value, Context>;
  readonly envVarName: string;
  readonly envVarValue: string;
  readonly ps: ConfigurableEnvVarPropertiesSupplier<Configuration, Context>;
}

export interface ConfigurableEnvVarProperty<Configuration, Value, Context>
  extends govn.ConfigurableProperty<Configuration, Value, Context> {
  readonly isRequired?: boolean;
  readonly populateEnvVarValueSync: (
    cevpp: ConfigurableEnvVarPropertyPopulate<Configuration, Value, Context>,
  ) => Value;
  readonly populateEnvVarValue?: (
    cevpp: ConfigurableEnvVarPropertyPopulate<Configuration, Value, Context>,
  ) => Promise<Value>;
}

export type ConfigurableEnvVarProperties<Configuration, Context> =
  ConfigurableEnvVarProperty<
    Configuration,
    // deno-lint-ignore no-explicit-any
    any,
    Context
  >[];

export interface ConfigurableEnvVarPropertiesSupplier<Configuration, Context>
  extends govn.ConfigurablePropertiesSupplier<Configuration, Context> {
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
    property: ConfigurableEnvVarProperty<Configuration, any, Context>,
    config: Configuration,
    ctx?: Context,
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

  abstract constructSync(ctx?: Context): Configuration;
  abstract unhandledPropertySync(
    p: ConfigurableEnvVarProperty<Configuration, unknown, Context>,
    config: Configuration,
    ctx?: Context,
  ): unknown;

  textProperty(
    name: govn.ConfigurablePropertyName<Configuration>,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    populate?: (
      cevpp: ConfigurableEnvVarPropertyPopulate<Configuration, string, Context>,
    ) => string,
  ): ConfigurableEnvVarProperty<Configuration, string, Context> {
    return {
      name,
      aliases,
      populateEnvVarValueSync: populate ||
        (({ envVarValue, config }) => {
          const [mutate] = propertyName(name);
          // deno-lint-ignore no-explicit-any
          (config as any)[mutate] = envVarValue;
          return envVarValue;
        }),
    };
  }

  requiredTextProperty(
    name: govn.ConfigurablePropertyName<Configuration>,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    populate?: (
      cevpp: ConfigurableEnvVarPropertyPopulate<Configuration, string, Context>,
    ) => string,
  ): ConfigurableEnvVarProperty<Configuration, string, Context> {
    return { ...this.textProperty(name, aliases, populate), isRequired: true };
  }

  numericProperty(
    name: govn.ConfigurablePropertyName<Configuration>,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    onGuardFailure?: (o: unknown) => number,
    populate?: (
      cevpp: ConfigurableEnvVarPropertyPopulate<Configuration, number, Context>,
    ) => number,
  ): ConfigurableEnvVarProperty<Configuration, number, Context> {
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
      populateEnvVarValueSync: populate ||
        (({ envVarValue, config }) => {
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

  requiredNumericProperty(
    name: govn.ConfigurablePropertyName<Configuration>,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    onGuardFailure?: (o: unknown) => number,
    populate?: (
      cevpp: ConfigurableEnvVarPropertyPopulate<Configuration, number, Context>,
    ) => number,
  ): ConfigurableEnvVarProperty<Configuration, number, Context> {
    return {
      ...this.numericProperty(name, aliases, onGuardFailure, populate),
      isRequired: true,
    };
  }

  jsonTextProperty<Type>(
    name: govn.ConfigurablePropertyName<Configuration>,
    guard: safety.TypeGuard<Type>,
    onGuardFailure: (o: unknown, err?: Error) => Type | undefined,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    populate?: (
      cevpp: ConfigurableEnvVarPropertyPopulate<
        Configuration,
        Type | undefined,
        Context
      >,
    ) => Type | undefined,
  ): ConfigurableEnvVarProperty<Configuration, Type | undefined, Context> {
    const valueGuard = {
      guard,
      onGuardFailure: onGuardFailure || ((_: unknown) => undefined),
    };
    return {
      name,
      aliases,
      populateEnvVarValueSync: populate ||
        (({ envVarValue, config }) => {
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

  requiredJsonTextProperty<Type>(
    name: govn.ConfigurablePropertyName<Configuration>,
    guard: safety.TypeGuard<Type>,
    onGuardFailure: (o: unknown, err?: Error) => Type | undefined,
    aliases?: govn.ConfigurablePropertyName<Configuration>[],
    populate?: (
      cevpp: ConfigurableEnvVarPropertyPopulate<
        Configuration,
        Type | undefined,
        Context
      >,
    ) => Type | undefined,
  ): ConfigurableEnvVarProperty<Configuration, Type | undefined, Context> {
    return {
      ...this.jsonTextProperty(name, guard, onGuardFailure, aliases, populate),
      isRequired: true,
    };
  }

  configureSync(ctx?: Context): Configuration {
    let config = this.constructSync(ctx);
    for (const property of this.ps.properties) {
      const tryNames = property.aliases
        ? [property.name, ...property.aliases]
        : [property.name];
      let handled = false;
      let value: unknown | undefined;
      for (const tryName of tryNames) {
        const envVarName = this.envVarName(tryName, property, config, ctx);
        const envVarValue = Deno.env.get(envVarName);
        ctx = typeof ctx === "object"
          ? { ...ctx, envVarName, envVarValue }
          : ctx;
        const cevpp: Omit<
          ConfigurableEnvVarPropertyPopulate<
            Configuration,
            // deno-lint-ignore no-explicit-any
            any,
            Context
          >,
          "envVarValue"
        > = {
          property,
          envVarName,
          config,
          ctx,
          ps: this.ps,
        };
        if (envVarValue) {
          value = property.populateEnvVarValueSync({ ...cevpp, envVarValue });
          handled = true;
        }
        if (this.ecee) {
          this.ecee.emitSync(
            "searchEnvForProperty",
            handled,
            cevpp,
            tryName,
            value,
          );
        }
        if (handled) break;
      }
      if (!handled) {
        if (property.populateDefaultSync) {
          property.populateDefaultSync({ config, property, ctx });
        } else {
          if (this.ecee) {
            this.ecee.emitSync(
              "envPropertyNotHandled",
              property,
              config,
              this.ps,
              ctx,
            );
          }
          this.unhandledPropertySync(property, config, ctx);
        }
      }
    }
    if (this.ps.configGuard) {
      if (!this.ps.configGuard.guard(config)) {
        config = this.ps.configGuard.onGuardFailureSync(config);
      }
    }
    return config;
  }
}

export abstract class AsyncEnvConfiguration<Configuration, Context>
  extends EnvConfiguration<Configuration, Context>
  implements govn.ConfigurationSupplier<Configuration, Context> {
  // deno-lint-ignore require-await
  async construct(ctx?: Context): Promise<Configuration> {
    return this.constructSync(ctx);
  }

  // deno-lint-ignore require-await
  async unhandledProperty(
    p: ConfigurableEnvVarProperty<Configuration, unknown, Context>,
    config: Configuration,
    ctx?: Context,
  ): Promise<unknown> {
    return this.unhandledPropertySync(p, config, ctx);
  }

  async configure(ctx?: Context): Promise<Configuration> {
    let config = await this.construct(ctx);
    for (const property of this.ps.properties) {
      const tryNames = property.aliases
        ? [property.name, ...property.aliases]
        : [property.name];
      let handled = false;
      let value: unknown | undefined;
      for (const tryName of tryNames) {
        const envVarName = this.envVarName(tryName, property, config, ctx);
        const envVarValue = Deno.env.get(envVarName);
        ctx = typeof ctx === "object"
          ? { ...ctx, envVarName, envVarValue }
          : ctx;
        const cevpp: Omit<
          ConfigurableEnvVarPropertyPopulate<
            Configuration,
            // deno-lint-ignore no-explicit-any
            any,
            Context
          >,
          "envVarValue"
        > = {
          config,
          property,
          envVarName,
          ctx,
          ps: this.ps,
        };
        if (envVarValue) {
          if (property.populateEnvVarValue) {
            value = await property.populateEnvVarValue({
              ...cevpp,
              envVarValue,
            });
          } else {
            value = property.populateEnvVarValueSync({ ...cevpp, envVarValue });
          }
          handled = true;
        }
        if (this.ecee) {
          await this.ecee.emit(
            "searchEnvForProperty",
            handled,
            cevpp,
            tryName,
            value,
          );
        }
        if (handled) break;
      }
      if (!handled) {
        if (property.populateDefault) {
          await property.populateDefault({ config, property, ctx });
        } else if (property.populateDefaultSync) {
          property.populateDefaultSync({ config, property, ctx });
        } else {
          if (this.ecee) {
            await this.ecee.emit(
              "envPropertyNotHandled",
              property,
              config,
              this.ps,
              ctx,
            );
          }
          await this.unhandledProperty(property, config, ctx);
        }
      }
    }
    if (this.ps.configGuard) {
      if (!this.ps.configGuard.guard(config)) {
        if (this.ps.configGuard.onGuardFailure) {
          config = await this.ps.configGuard.onGuardFailure(config);
        } else {
          config = this.ps.configGuard.onGuardFailureSync(config);
        }
      }
    }
    return config;
  }
}
