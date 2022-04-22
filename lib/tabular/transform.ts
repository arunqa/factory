import * as govn from "./governance.ts";
import * as c from "./case.ts";

/**
 * tableColumnsFromObject transforms an object to its "tabular" representation,
 * basically converting each camelCase name to snake_case and copying the
 * data over for requested column names.
 * @param o the object to convert to a table-like structure
 * @param defaultValues in case defaults should be provided
 * @param columns list of column names or column name+value tranformation pair
 * @returns a clone of o with property names converted to snake case
 */
export function tableColumnsFromObject<
  TableRecord extends govn.UntypedTabularRecordObject,
  Object extends govn.TableToObject<TableRecord> = govn.TableToObject<
    TableRecord
  >,
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
    const colName = c.camelToSnakeCase(propName);
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
  TableRecord extends govn.UntypedTabularRecordObject,
  Object extends govn.TableToObject<TableRecord> = govn.TableToObject<
    TableRecord
  >,
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
      row[c.camelToSnakeCase(propName)] = Array.isArray(matched)
        ? matched[1](value) // transform the value
        : value;
    }
    return row;
  }, (defaultValues ?? {}) as Record<string, unknown>) as TableRecord;
}

/**
 * transformTabularRecord transforms an object to its "tabular" representation,
 * converting each camelCase name to snake_case and copying the data over.
 * Every property on o will be copied into the result.
 * @param o the object to convert to a table-like structure
 * @param defaultValues in case defaults should be provided
 * @returns a clone of o with property names converted to snake case
 */
export function transformTabularRecord<
  TableRecord extends govn.UntypedTabularRecordObject,
  Object extends govn.TableToObject<TableRecord> = govn.TableToObject<
    TableRecord
  >,
>(
  o: Object,
  defaultValues?: TableRecord,
): TableRecord {
  return Object.entries(o).reduce((row, kv) => {
    row[c.camelToSnakeCase(kv[0])] = kv[1];
    return row;
  }, (defaultValues ?? {}) as Record<string, unknown>) as TableRecord;
}

/**
 * transformTabularRecords transforms a list of object to its "tabular" representation,
 * converting each camelCase name to snake_case and copying the data over for
 * requested property names.
 * @param objects the object instances to convert to a table-like structure
 * @param defaultValues in case defaults should be provided
 * @param properties list of property names or prop name+value tranformation pair
 * @returns a clone of objects with property names converted to snake case
 */
export function transformTabularRecords<
  // deno-lint-ignore ban-types
  TableRecord extends object,
  Object extends govn.TableToObject<TableRecord> = govn.TableToObject<
    TableRecord
  >,
  PropertyName extends keyof Object = keyof Object,
>(
  objects: Iterable<Object>,
  defaultValues?: TableRecord,
  ...properties:
    (PropertyName | [name: PropertyName, value: (v: unknown) => unknown])[]
): TableRecord[] {
  const result: TableRecord[] = [];
  for (const o of objects) {
    // TODO: add nextID() to create identity relationships / denormalization / etc.
    result.push(tableColumnsFromObjectProperties(
      o,
      defaultValues,
      ...properties,
    ));
  }
  return result;
}
