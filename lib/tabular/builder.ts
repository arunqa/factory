import * as govn from "./governance.ts";
import * as p from "./proxy.ts";

export type TabularRecordsBuilderIndexName = string;

export type InsertableRecord<
  T extends govn.UntypedObject = govn.UntypedObject,
> =
  & T
  & Partial<govn.MutatableTabularRecordIdSupplier>;
export type InsertedRecord<T extends govn.UntypedObject = govn.UntypedObject> =
  & T
  & govn.TabularRecordIdSupplier;

export interface TabularRecordsBuilder<
  Insertable extends InsertableRecord,
  Inserted extends InsertedRecord,
  IndexName = unknown,
> {
  readonly upsert: (record: Insertable) => Inserted;
  readonly findByID: (
    id: govn.TabularRecordID,
  ) => Inserted | undefined;
  readonly findByIndex: <Value>(
    indexName: IndexName,
    value: Value,
  ) => Inserted | undefined;
  readonly inspectForDefn: () => Inserted | undefined;
  readonly records: Inserted[];
}

export function tabularRecordsAutoRowIdBuilder<
  RecordProps extends govn.UntypedObject,
  IndexName = unknown,
  Insertable extends InsertableRecord = InsertableRecord<RecordProps>,
  Inserted extends InsertedRecord = InsertedRecord<RecordProps>,
>(
  options?: {
    upsertStrategy?: {
      readonly exists: (
        record: Insertable,
        rowID: govn.TabularRecordID,
        index: (name: IndexName) => Map<unknown, Inserted>,
      ) => Inserted | undefined;
      readonly index?: (
        record: Inserted,
        index: (name: IndexName) => Map<unknown, Inserted>,
      ) => void;
    };
  },
): TabularRecordsBuilder<Insertable, Inserted, IndexName> {
  const rowIdTextIndexName = "rowID" as unknown as IndexName;
  const records: Inserted[] = [];
  let indexes:
    | Map<IndexName, Map<unknown, Inserted>>
    | undefined;
  const prepareIndex = <Value>(name: IndexName) => {
    if (!indexes) indexes = new Map();
    let index = indexes.get(name);
    if (!index) {
      index = new Map<Value, Inserted>();
      indexes.set(name, index);
    }
    return index;
  };

  let inspectForDefn: Inserted | undefined = undefined;
  const { upsertStrategy } = options ?? {};
  const result: TabularRecordsBuilder<
    Insertable,
    Inserted,
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
      const inserted = record as Inserted;
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

export interface TabularRecordsBuilders<
  Identity extends govn.TabularRecordsIdentity,
> {
  readonly autoRowIdProxyBuilder: <
    RecordProps extends govn.UntypedObject,
    IndexName = unknown,
    Insertable extends InsertableRecord = InsertableRecord<RecordProps>,
    Inserted extends InsertedRecord = InsertedRecord<RecordProps>,
  >(
    defn:
      & Omit<govn.TabularRecordDefn<RecordProps, Identity>, "columns">
      & Partial<Pick<govn.TabularRecordDefn<RecordProps, Identity>, "columns">>,
    options?: {
      upsertStrategy?: {
        readonly exists: (
          record: Insertable,
          rowID: govn.TabularRecordID,
          index: (name: IndexName) => Map<unknown, Inserted>,
        ) => Inserted | undefined;
        readonly index?: (
          record: Inserted,
          index: (name: IndexName) => Map<unknown, Inserted>,
        ) => void;
      };
    },
  ) => TabularRecordsBuilder<
    Insertable,
    Inserted,
    IndexName
  >;

  readonly builder: <
    Insertable extends InsertableRecord,
    Inserted extends InsertedRecord,
  >(identity: Identity) =>
    | TabularRecordsBuilder<
      Insertable,
      Inserted,
      // deno-lint-ignore no-explicit-any
      any
    >
    | undefined;

  readonly definedTabularRecords: () => AsyncGenerator<
    // deno-lint-ignore no-explicit-any
    govn.DefinedTabularRecords<any>
  >;
}

export function definedTabularRecordsBuilders<
  Identity extends govn.TabularRecordsIdentity,
>(): TabularRecordsBuilders<Identity> {
  const proxied = new Map<Identity, {
    defn:
      // deno-lint-ignore no-explicit-any
      & Omit<govn.TabularRecordDefn<any, Identity>, "columns">
      // deno-lint-ignore no-explicit-any
      & Partial<Pick<govn.TabularRecordDefn<any, Identity>, "columns">>;
    // deno-lint-ignore no-explicit-any
    builder: TabularRecordsBuilder<any, any, any>;
  }>();
  return {
    autoRowIdProxyBuilder: (defn, options) => {
      const builder = tabularRecordsAutoRowIdBuilder(options);
      if (proxied.get(defn.identity)) {
        throw new Error(
          `Duplicate builder defined: ${defn.identity} in typicalTabularRecordsBuilders()`,
        );
      }
      proxied.set(defn.identity, { defn, builder });
      return builder;
    },

    builder: (identity: Identity) => {
      return proxied.get(identity)?.builder;
    },

    definedTabularRecords: async function* () {
      for (const proxy of proxied) {
        const [_identity, builderDefn] = proxy;
        yield p.definedTabularRecordsProxy(
          builderDefn.defn,
          builderDefn.builder.records,
        );
      }
    },
  };
}

export abstract class TabularRecordsFactory<
  Identity extends govn.TabularRecordsIdentity,
> {
  #defined = new Map<Identity, {
    defn:
      // deno-lint-ignore no-explicit-any
      & Omit<govn.TabularRecordDefn<any, Identity>, "columns">
      // deno-lint-ignore no-explicit-any
      & Partial<Pick<govn.TabularRecordDefn<any, Identity>, "columns">>;
    // deno-lint-ignore no-explicit-any
    builder: TabularRecordsBuilder<any, any, any>;
  }>();

  constructor(readonly namespace: (trID: Identity) => string) {
  }

  define<Record extends govn.UntypedObject, IndexName = unknown>(
    identity: Identity,
    builder: TabularRecordsBuilder<
      InsertableRecord<Record>,
      InsertedRecord<Record>,
      IndexName
    >,
  ) {
    const existing = this.#defined.get(identity);
    if (existing) {
      console.warn(
        `Duplicate builder defined: ${identity} in TabularRecordsFactory, using existing`,
      );
      return existing.builder;
    }
    this.#defined.set(identity, {
      defn: {
        identity,
        namespace: this.namespace(identity),
      },
      builder,
    });
    return builder;
  }

  async *defined() {
    for (const b of this.#defined) {
      const [_, builderDefn] = b;
      yield p.definedTabularRecordsProxy(
        builderDefn.defn,
        builderDefn.builder.records,
      );
    }
  }
}
