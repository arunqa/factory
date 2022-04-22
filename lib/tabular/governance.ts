import * as r from "../reflect/reflect.ts";

// deno-lint-ignore ban-types
export type UntypedTabularRecordObject = object;

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

/**
 * TabularRecordID identifies a single row of data within a list of records.
 */
export type TabularRecordID = number | string;

/**
 * TabularRecordIdRef is a reference to another "table"'s TabularRecordID. It
 * is equivalent to a foreign key reference.
 */
export type TabularRecordIdRef = TabularRecordID;

/**
 * TabularRecordsIdentity is a table or view name; it's abstract so that it can
 * serve multiple purposes.
 */
export type TabularRecordsIdentity = string;

export interface TabularRecordColumnDefn<
  TabularRecord extends UntypedTabularRecordObject,
  ColumnName extends keyof TabularRecord = keyof TabularRecord,
> {
  readonly identity: ColumnName;
  readonly dataType?: r.TypeInfo;
  readonly help?: string;
}

export interface TabularProxyColumnsSupplier<
  TabularRecord extends UntypedTabularRecordObject,
> {
  readonly columns: TabularRecordColumnDefn<TabularRecord>[];
}

export interface TabularRecordDefn<
  TabularRecord extends UntypedTabularRecordObject,
> extends TabularProxyColumnsSupplier<TabularRecord> {
  readonly identity: TabularRecordsIdentity;
  readonly namespace?: string;
  readonly help?: string;
}

export interface TabularRecordsDefnSupplier<
  TableRecord extends UntypedTabularRecordObject,
> {
  readonly tabularRecordDefn: TabularRecordDefn<TableRecord>;
}

export interface DefinedTabularRecordsProxy<
  TableRecord extends UntypedTabularRecordObject,
> extends TabularRecordsDefnSupplier<TableRecord> {
  readonly dataRows: () => Promise<TableRecord[]>;
}

// deno-lint-ignore no-empty-interface
export interface DefinedTabularAutoRowIdRecordsProxy<
  TableRecord extends UntypedTabularRecordObject & { id: TabularRecordID },
> extends DefinedTabularRecordsProxy<TableRecord> {
}

export interface DefinedTabularRecordsProxiesSupplier {
  readonly definedTabularRecords: <
    TableRecord extends UntypedTabularRecordObject = UntypedTabularRecordObject,
  >() => AsyncGenerator<
    DefinedTabularRecordsProxy<TableRecord>
  >;
}
