import * as t from "../../lib/tabular/mod.ts";

export interface OriginatorTabularProps {
  readonly originator: string;
  readonly provenance: string;
}

export type OriginatorTabularRecord = t.InsertedRecord<
  OriginatorTabularProps
>;

export class OriginatorTabularRecordsFactory<
  Identity extends t.TabularRecordsIdentity = "originator",
> extends t.TabularRecordsFactory<Identity> {
  readonly originatorRB: t.TabularRecordsBuilder<
    t.InsertableRecord<OriginatorTabularProps>,
    t.InsertedRecord<OriginatorTabularProps>,
    "originator"
  >;

  constructor() {
    super(() => "origin");
    this.originatorRB = this.define(
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
