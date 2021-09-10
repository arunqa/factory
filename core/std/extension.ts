import * as govn from "../../governance/mod.ts";

// deno-lint-ignore no-explicit-any
export const deepClone = (value: any): any | never => {
  const typeofValue = typeof value;
  // primatives are copied by value.
  if (
    [
      "string",
      "number",
      "boolean",
      "string",
      "bigint",
      "symbol",
      "null",
      "undefined",
      "function",
    ].includes(typeofValue)
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(deepClone);
  }
  if (typeofValue === "object") {
    // deno-lint-ignore no-explicit-any
    const clone: any = {};
    for (const prop in value) {
      clone[prop] = deepClone(value[prop]);
    }
    return clone;
  }
  throw new Error(`You've tried to clone something that can't be cloned`);
};

export class CachedExtensions implements govn.ExtensionsManager {
  readonly cache = new Map<string, govn.ExtensionModule>();

  get extensions() {
    return this.cache.values();
  }

  async importModule(name: string): Promise<govn.ExtensionModule> {
    let importedModule: govn.ExtensionModule;
    try {
      const found = this.cache.get(name);
      if (found) return found;

      const module = await import(name);
      importedModule = {
        isValid: true,
        provenance: name,
        module,
        exports: <Export>(assign?: govn.ExtensionExportsFilter) => {
          const properties: Record<string, unknown> = {};
          for (
            const entry of Object.entries(module as Record<string, unknown>)
          ) {
            const [key, value] = entry;
            if (!assign || assign(key, value)) {
              properties[key] = value;
            }
          }
          return properties as Export;
        },
      };
    } catch (importError) {
      importedModule = {
        isValid: false,
        provenance: name,
        exports: <Export>() => {
          return {} as Export;
        },
        module: undefined,
        importError,
      };
    }
    this.cache.set(name, importedModule);
    return importedModule;
  }

  async extend(...consumers: govn.ExtensionConsumer[]): Promise<void> {
    for (const ec of consumers) {
      for (const pe of ec.potentialModules()) {
        ec.consumeModule(await this.importModule(pe));
      }
    }
  }
}
