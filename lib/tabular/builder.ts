import * as govn from "./governance.ts";

export type TabularRecordsBuilderIndexName = string;

export interface TabularRecordsBuilder<
  InsertableTableObject extends
    & govn.UntypedObject
    & Partial<govn.MutatableTabularRecordIdSupplier>,
  InsertedTableObject extends
    & govn.UntypedObject
    & Readonly<govn.MutatableTabularRecordIdSupplier>,
  IndexName = unknown,
> {
  readonly upsert: (record: InsertableTableObject) => InsertedTableObject;
  readonly findByID: (
    id: govn.TabularRecordID,
  ) => InsertedTableObject | undefined;
  readonly findByIndex: <Value>(
    indexName: IndexName,
    value: Value,
  ) => InsertedTableObject | undefined;
  readonly inspectForDefn: () => InsertedTableObject | undefined;
  readonly records: InsertedTableObject[];
}

export function tabularRecordsAutoRowIdBuilder<
  TableObject extends govn.UntypedObject,
  IndexName = unknown,
  InsertableTableObject extends
    & govn.UntypedObject
    & Partial<govn.MutatableTabularRecordIdSupplier> =
      & TableObject
      & Partial<govn.MutatableTabularRecordIdSupplier>,
  InsertedTableObject extends
    & govn.UntypedObject
    & Readonly<govn.MutatableTabularRecordIdSupplier> =
      & TableObject
      & Readonly<govn.MutatableTabularRecordIdSupplier>,
>(
  options?: {
    upsertStrategy?: {
      readonly exists: (
        record: InsertableTableObject,
        rowID: govn.TabularRecordID,
        index: (name: IndexName) => Map<unknown, InsertedTableObject>,
      ) => InsertedTableObject | undefined;
      readonly index?: (
        record: InsertedTableObject,
        index: (name: IndexName) => Map<unknown, InsertedTableObject>,
      ) => void;
    };
  },
): TabularRecordsBuilder<
  InsertableTableObject,
  InsertedTableObject,
  IndexName
> {
  const rowIdTextIndexName = "rowID" as unknown as IndexName;
  const records: InsertedTableObject[] = [];
  let indexes:
    | Map<IndexName, Map<unknown, InsertedTableObject>>
    | undefined;
  const prepareIndex = <Value>(name: IndexName) => {
    if (!indexes) indexes = new Map();
    let index = indexes.get(name);
    if (!index) {
      index = new Map<Value, InsertedTableObject>();
      indexes.set(name, index);
    }
    return index;
  };

  let inspectForDefn: InsertedTableObject | undefined = undefined;
  const { upsertStrategy } = options ?? {};
  const result: TabularRecordsBuilder<
    InsertableTableObject,
    InsertedTableObject,
    IndexName
  > = {
    upsert: (record) => {
      if (typeof record.id !== "undefined") {
        const lookupRowID = record.id;
        const found = typeof lookupRowID == "number"
          ? records[lookupRowID]
          : indexes?.get(rowIdTextIndexName)?.get(lookupRowID);
        if (found) return found;
      }

      const insertRowID = record.id ?? records.length;
      const exists = upsertStrategy?.exists(record, insertRowID, prepareIndex);
      if (exists) return exists;

      (record as govn.MutatableTabularRecordIdSupplier).id = insertRowID;
      const inserted = record as InsertedTableObject;
      if (!inspectForDefn) inspectForDefn = inserted;
      records.push(inserted);
      if (typeof insertRowID == "string") {
        prepareIndex(rowIdTextIndexName).set(insertRowID, inserted);
      }
      if (upsertStrategy?.index) {
        upsertStrategy.index(inserted, prepareIndex);
      }
      return inserted;
    },
    findByID: (rowID) => {
      return typeof rowID == "number"
        ? records[rowID]
        : indexes?.get(rowIdTextIndexName)?.get(rowID);
    },
    findByIndex: (indexName, value) => {
      return indexes?.get(indexName)?.get(value);
    },
    inspectForDefn: () => inspectForDefn,
    records,
  };
  return result;
}
