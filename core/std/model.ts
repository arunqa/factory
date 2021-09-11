import { safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";
import * as e from "./extension.ts";

export const isModelSupplier = safety.typeGuard<govn.ModelSupplier<unknown>>(
  "model",
);

export const isIdentifiableModelSupplier = safety.typeGuard<
  govn.IdentifiableModelSupplier<unknown>
>(
  "model",
  "modelIdentity",
);

/**
 * Transform the dest into a ModelSupplier, pointing to the source model
 * as a reference (not cloned).
 * @param source The model supplier we want the dest to reference
 * @param dest The target object that should reference the source model
 * @returns
 */
export function referenceModel<
  ModelSupplier extends govn.ModelSupplier<unknown>,
>(
  source: ModelSupplier,
  dest: unknown,
  options?: {
    readonly append?: Iterable<[key: string, value: unknown]>;
    readonly onDestIsNotMutatable?: (
      reason: string,
      source: ModelSupplier,
      dest: unknown,
    ) => unknown;
  },
): ModelSupplier | unknown {
  if (dest && typeof dest === "object") {
    if (isIdentifiableModelSupplier(source)) {
      // deno-lint-ignore no-explicit-any
      (dest as any).model = source.model;
      // deno-lint-ignore no-explicit-any
      (dest as any).modelIdentity = source.modelIdentity;
    } else if (isModelSupplier(source)) {
      // deno-lint-ignore no-explicit-any
      (dest as any).model = source.model;
    }
    const result = dest as ModelSupplier;
    if (options?.append) {
      const model = result.model as Record<string, unknown>;
      for (const append of options?.append) {
        const [key, value] = append;
        model[key] = value;
      }
    }
    return result;
  } else {
    if (options?.onDestIsNotMutatable) {
      return options?.onDestIsNotMutatable(
        "dest is not an object in referenceModel",
        source,
        dest,
      );
    } else {
      console.warn("referenceModel: dest is not an object");
    }
  }
  return dest;
}

/**
 * Transform the dest into a ModelSupplier, cloning to the source model
 * @param source The model supplier we want the dest to become a clone of
 * @param dest The target object that should clone from the source model
 * @returns
 */
export function cloneModel<
  ModelSupplier extends govn.ModelSupplier<unknown>,
>(
  source: ModelSupplier,
  dest: unknown,
  options?: {
    readonly append?: Iterable<[key: string, value: unknown]>;
    readonly onDestIsNotMutatable?: (
      reason: string,
      source: ModelSupplier,
      dest: unknown,
    ) => unknown;
  },
): ModelSupplier | unknown {
  if (dest && typeof dest === "object") {
    if (isIdentifiableModelSupplier(source)) {
      // deno-lint-ignore no-explicit-any
      (dest as any).model = e.deepClone(source.model);
      // deno-lint-ignore no-explicit-any
      (dest as any).modelIdentity = source.modelIdentity;
    } else if (isModelSupplier(source)) {
      // deno-lint-ignore no-explicit-any
      (dest as any).model = e.deepClone(source.model);
    }
    const result = dest as ModelSupplier;
    if (options?.append) {
      const model = result.model as Record<string, unknown>;
      for (const append of options?.append) {
        const [key, value] = append;
        model[key] = value;
      }
    }
    return result;
  } else {
    if (options?.onDestIsNotMutatable) {
      return options?.onDestIsNotMutatable(
        "dest is not an object in cloneModel",
        source,
        dest,
      );
    } else {
      console.warn("cloneModel: dest is not an object");
    }
  }
  return dest;
}

/**
 * Clone properties from source into dest.model if the property in source does
 * not alrady exist in dest.model.
 * @param source Any arbitrary string-keyed object
 * @param dest The destination's model to merge source keys into
 * @param filter Return transformed value that should be merged, undefined to skip property
 * @returns The destination
 */
export const mutateModelProperties = <
  ModelSupplier extends govn.ModelSupplier<unknown>,
>(
  source: Record<string, unknown>,
  dest: ModelSupplier,
  options?: {
    readonly append?: Iterable<[key: string, value: unknown]>;
    readonly filter?: (key: string, value: unknown) => unknown | undefined;
    readonly onDestIsNotMutatable?: (
      reason: string,
      source: Record<string, unknown>,
      dest: ModelSupplier,
    ) => ModelSupplier;
  },
): ModelSupplier => {
  if (isModelSupplier(dest)) {
    if (typeof dest.model === "object") {
      const merged = dest.model as Record<string, unknown>;
      if (options?.filter) {
        const filter = options?.filter;
        for (const prop in source) {
          if (!(prop in merged)) {
            const filtered = filter(prop, source[prop]);
            if (filtered) {
              merged[prop] = filtered;
            }
          }
        }
      } else {
        for (const prop in source) {
          if (!(prop in merged)) {
            merged[prop] = e.deepClone(source[prop]);
          }
        }
      }
      if (options?.append) {
        for (const append of options?.append) {
          const [key, value] = append;
          merged[key] = value;
        }
      }
    } else {
      if (options?.onDestIsNotMutatable) {
        return options?.onDestIsNotMutatable(
          "dest.model is not an object in mutateModelProperties",
          source,
          dest,
        );
      } else {
        console.warn("mutateModelProperties: dest.model is not an object");
      }
    }
  } else {
    if (options?.onDestIsNotMutatable) {
      return options?.onDestIsNotMutatable(
        "dest is not a ModelSupplier in mutateModelProperties",
        source,
        dest,
      );
    } else {
      console.warn("mutateModelProperties: dest is not a ModelSupplier");
    }
  }
  return dest;
};
