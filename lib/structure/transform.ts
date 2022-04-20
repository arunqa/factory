export type ScalarValue =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "undefined";

export type TsJsRuntimeValue =
  | ScalarValue
  | "symbol"
  | "object"
  | "function";

export type CamelCase<S extends string> = S extends
  `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

// deep, 1:1 mapping of a SQL table-like object to its camelCase JS counterpart
export type TableToObject<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Date ? T[K]
    : // deno-lint-ignore ban-types
    (T[K] extends object ? TableToObject<T[K]> : T[K]);
};

export type DatesAsStrings<T> = {
  [K in keyof T as CamelCase<string & K>]: (T[K] extends Date ? string : T[K]);
};

export type ObjectsAsJsonText<T> = {
  [K in keyof T as CamelCase<string & K>]:
    // deno-lint-ignore ban-types
    (T[K] extends object ? string : T[K]);
};

export const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/**
 * tableFromObject transforms an object to its "tabular" representation,
 * converting each camelCase name to snake_case and copying the data over.
 * Every property on o will be copied into the result.
 * @param o the object to convert to a table-like structure
 * @param defaultValues in case defaults should be provided
 * @returns a clone of o with property names converted to snake case
 */
export function tableRecordFromObject<
  // deno-lint-ignore ban-types
  TableRecord extends object,
  Object extends TableToObject<TableRecord> = TableToObject<TableRecord>,
>(
  o: Object,
  defaultValues?: TableRecord,
): TableRecord {
  return Object.entries(o).reduce((row, kv) => {
    row[camelToSnakeCase(kv[0])] = kv[1];
    return row;
  }, (defaultValues ?? {}) as Record<string, unknown>) as TableRecord;
}

/**
 * tableColumnsFromObject transforms an object to its "tabular" representation,
 * basically converting each camelCase name to snake_case and copying the
 * data over for requested column names.
 * @param o the object to convert to a table-like structure
 * @param defaultValues in case defaults should be provided
 * @param properties list of column names or column name+value tranformation pair
 * @returns a clone of o with property names converted to snake case
 */
export function tableColumnsFromObject<
  // deno-lint-ignore ban-types
  TableRecord extends object,
  Object extends TableToObject<TableRecord> = TableToObject<TableRecord>,
  ColumnName extends keyof TableRecord = keyof TableRecord,
>(
  o: Object,
  defaultValues?: TableRecord,
  ...columns:
    // supply the list of columns either as name or name+value transformation pair
    (ColumnName | [name: ColumnName, value: (v: unknown) => unknown])[]
): TableRecord {
  return Object.entries(o).reduce((row, kv) => {
    const [propName, value] = kv;
    const colName = camelToSnakeCase(propName);
    const matched = columns.find((c) =>
      Array.isArray(c) ? (c[0] == colName) : (c == colName)
    );
    if (matched) {
      row[colName] = Array.isArray(matched) ? matched[1](value) : value;
    }
    return row;
  }, (defaultValues ?? {}) as Record<string, unknown>) as TableRecord;
}

/**
 * tableColumnsFromObjectProperties transforms an object to its "tabular"
 * representation, converting each camelCase name to snake_case and copying
 * the data over for requested property names.
 * @param o the object to convert to a table-like structure
 * @param defaultValues in case defaults should be provided
 * @param properties list of property names or prop name+value tranformation pair
 * @returns a clone of o with property names converted to snake case
 */
export function tableColumnsFromObjectProperties<
  // deno-lint-ignore ban-types
  TableRecord extends object,
  Object extends TableToObject<TableRecord> = TableToObject<TableRecord>,
  PropertyName extends keyof Object = keyof Object,
>(
  o: Object,
  defaultValues?: TableRecord,
  ...properties:
    (PropertyName | [name: PropertyName, value: (v: unknown) => unknown])[]
): TableRecord {
  return Object.entries(o).reduce((row, kv) => {
    const [propName, value] = kv;
    const matched = properties.find((p) =>
      Array.isArray(p) ? (p[0] == propName) : (p == propName)
    );
    if (matched) {
      row[camelToSnakeCase(propName)] = Array.isArray(matched)
        ? matched[1](value) // transform the value
        : value;
    }
    return row;
  }, (defaultValues ?? {}) as Record<string, unknown>) as TableRecord;
}
