import { safety } from "../deps.ts";
import * as govn from "../../governance/mod.ts";

export const isProductsSupplierUntyped = safety.typeGuard<
  govn.ProductsSupplier<unknown>
>("products");

export function isProductsSupplier<Product>(
  o: unknown,
): o is govn.ProductsSupplier<Product> {
  return isProductsSupplierUntyped(o);
}

export const isProductsSyncSupplierUntyped = safety.typeGuard<
  govn.ProductsSyncSupplier<unknown>
>("productsSync");

export function isProductsSyncSupplier<Product>(
  o: unknown,
): o is govn.ProductsSyncSupplier<Product> {
  return isProductsSyncSupplierUntyped(o);
}

export function isProductsSuppliers<Product>(
  o: unknown,
): o is govn.ProductsSuppliers<Product> {
  return isProductsSupplier(o) && isProductsSyncSupplier(o);
}

export const isProductStrategy = safety.typeGuard<govn.ProductStrategy>(
  "produceProducts",
);
