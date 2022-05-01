import * as t from "../../lib/tabular/mod.ts";

export type OriginatorRecordIdRef = t.TabularRecordIdRef;

export interface OriginatorTabularProps {
  readonly originator: string;
  readonly provenance: string;
  readonly enabled: boolean;
}

export interface OriginatorTabularRecordRefSupplier {
  readonly originatorId: OriginatorRecordIdRef;
}

export type OriginatorTabularRecord = t.InsertedRecord<
  OriginatorTabularProps
>;

export class OriginatorTabularRecordsFactory<
  Identity extends t.TabularRecordsIdentity = "originator",
> extends t.TypicalNamedTabularRecordsBuildersFactory<Identity> {
  readonly originatorRB: t.TabularRecordsBuilder<
    t.InsertableRecord<OriginatorTabularProps>,
    t.InsertedRecord<OriginatorTabularProps>,
    "originator"
  >;
  constructor(namespace: (trID: Identity) => string) {
    super(namespace);
    this.originatorRB = this.prepareBuilder(
      "originator" as Identity,
      this.constructOriginatorRB(),
    );
  }

  constructOriginatorRB() {
    return t.tabularRecordsAutoRowIdBuilder<
      OriginatorTabularProps,
      "originator"
    >({
      upsertStrategy: {
        exists: (r, _rowID, index) => index("originator")?.get(r.originator),
        index: (r, index) => index("originator").set(r.originator, r),
      },
    });
  }
}

export abstract class DependentOriginatorTabularRecordsFactory<
  Identity extends t.TabularRecordsIdentity,
> extends t.TypicalDependentNamedTabularRecordsBuildersFactory<
  Identity,
  OriginatorTabularRecordsFactory<Identity>
> {
  abstract readonly originatorTR: OriginatorTabularRecord;

  get originatorRB() {
    return this.parentFactory.originatorRB;
  }

  constructor(parent: OriginatorTabularRecordsFactory<"originator">) {
    // coerce types so that the beneficiary is the child class, we already
    // know our own types
    super(parent as unknown as OriginatorTabularRecordsFactory<Identity>);
  }
}
