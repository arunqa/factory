import * as pDB from "./publication-db.ts";
import * as p from "./publication.ts";
import * as sql from "../../lib/sql/mod.ts";
import * as srg from "../../lib/sql/remote/governance.ts";
import * as srp from "../../lib/sql/remote/proxy.ts";
import * as srdbs from "../../lib/sql/remote/dbselector.ts";
import * as sqlShG from "../../lib/sql/shell/governance.ts";
import * as alaSQL from "../../lib/alasql/mod.ts";
import * as srf from "../../lib/sql/remote/flexible.ts";
import * as safety from "../../lib/safety/mod.ts";

import "../../lib/db/sql.ts"; // for window.globalSqlDbConns

export type ResultNature = "records" | "matrix" | "model" | "no-decoration";

export interface ResultNatureSupplier {
  readonly resultNature: ResultNature;
}

export const isResultNatureSupplier = safety.typeGuard<ResultNatureSupplier>(
  "resultNature",
);

/**
 * Registers an endpoint (usually /SQL) which accepts arbitrary SQL and
 * executes it against the publication server's SQLite database which is used to
 * store access logs, errors, and other diagnostic information for the server.
 */
export class PublicationSqlProxy extends alaSQL.AlaSqlProxy {
  readonly alaSqlProxy: srp.SqlProxySupplier<
    sql.QueryExecutionRecordsSupplier<sql.SqlRecord>
  >;
  readonly pubCtlDbSqlProxyDatabaseID = "pubctl";
  readonly pubCtlDbSqlProxy?: srp.SqlProxySupplier<
    sql.QueryExecutionRecordsSupplier<sql.SqlRecord>
  >;
  readonly commonProxies = srp.commonIdentifiableSqlProxies({
    allowAttemptWithoutUseDB: false,
  });
  readonly commonSqlAutoProxy = srp.multiSqlProxy(
    ...Array.from(this.commonProxies.values()).map((v) => v.proxy),
  );

  constructor(
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly database: pDB.PublicationDatabase | undefined,
    readonly inventory?: srg.ServerRuntimeSqlStmtInventory,
  ) {
    super({
      events: (asp) => {
        const ee = new sql.SqlEventEmitter();
        ee.on("constructStorage", async () => {
          await this.prepareSystemSqlViews();
          if (this.pubCtlDbSqlProxy) {
            // this is a special "proxy" database that we handle special
            asp.alaSqlEngine(
              `CREATE DATABASE IF NOT EXISTS ${this.pubCtlDbSqlProxyDatabaseID}`,
            );
          }
          this.commonProxies.forEach((sp) => {
            asp.alaSqlEngine(`CREATE DATABASE IF NOT EXISTS ${sp.identity}`);
          });
          asp.createJsFlexibleTableFromUntypedObjectArray(
            "dbms_reflection_prepare_db_tx_log",
            asp.defnTxLog,
          );
        });
        return ee;
      },
      customDbInventory: async (databaseID) => {
        switch (databaseID) {
          case this.pubCtlDbSqlProxyDatabaseID:
            return this.database
              ? this.sqliteDbInventory(this.database, databaseID)
              : undefined;
          default: {
            const foundProxy = this.commonProxies.get(
              databaseID as sqlShG.CommonDatabaseID,
            );
            return foundProxy
              ? await foundProxy.inventorySupplier()
              : undefined;
          }
        }
      },
    });

    // every USE DATABASE will match
    this.alaSqlProxy = srp.proxySQL(
      this,
      true, // allow defaulting without requring USE DATABASE
      () => true,
      // if USE DATABASE is supplied, don't rewrite the SQL
      srdbs.useDatabaseIdInFirstLineOfSqlDetector({ removeUseDbIdStmt: false }),
    );

    if (this.database) {
      this.pubCtlDbSqlProxy = srp.proxySQL(
        this.database,
        false,
        (dbID) => dbID == this.pubCtlDbSqlProxyDatabaseID,
      );
    }
  }

  async executeForeignSqlPayload(
    payload: srf.ForeignSqlStmtPayload,
    resultNature: ResultNature,
    reportInit?: (startInit: Date, endInit?: Date) => void,
  ) {
    if (!this.initialized) {
      const startInit = new Date();
      reportInit?.(startInit);
      await this.init();
      reportInit?.(startInit, new Date());
    }

    return await srf.executeSqlProxy<
      srf.ForeignSqlStmtPayload,
      // deno-lint-ignore no-explicit-any
      sql.QueryExecutionRecordsSupplier<sql.SqlRecord> | { alaSqlExec: any }
    >({
      payload,
      // deno-lint-ignore require-await
      identifiedSqlStmt: async (id) => this.inventory?.sqlStmt(id),
      executeSQL: async (args) => {
        if (this.pubCtlDbSqlProxy) {
          const pubCtlProxyResult = await this.pubCtlDbSqlProxy(args);
          const { execAttempted: pubCtlEA } = pubCtlProxyResult;
          if (pubCtlEA.attempted && pubCtlEA.detectedUseDB) {
            // this means that a "use database pubctl" was found
            return pubCtlProxyResult;
          }
        }

        const csapResult = await this.commonSqlAutoProxy(args);
        const { execAttempted: commonEA } = csapResult;
        if (commonEA.attempted && commonEA.detectedUseDB) return csapResult;

        if (resultNature == "no-decoration") {
          const alaSqlExec = this.alaSqlEngine.exec(args.executeSQL);
          return {
            execAttempted: { attempted: true, reason: "AlaSQL no-decoration" },
            executedSQL: args.executeSQL,
            data: { alaSqlExec },
          };
        }

        const aspResult = await this.alaSqlProxy(args);
        const aspDataRecs = aspResult.data?.records;
        if (
          aspResult.execAttempted.detectedUseDB && Array.isArray(aspDataRecs) &&
          aspDataRecs.length == 2
        ) {
          // if there was a USE DATABASE clause, data instance will be a two
          // entry array, the first entry will be a number to represent the use
          // database clause and the second entry is the real data. We want the
          // second entry, which is the real data.
          // deno-lint-ignore no-explicit-any
          const mutatedResult = aspResult as any;
          mutatedResult.data.records = aspDataRecs[1];
        }
        return aspResult;
      },
    });
  }

  async prepareSystemSqlViews() {
    if (this.publication.config.observability) {
      for await (
        const osv of this.publication.config.observability
          .systemObservableTabularRecords()
      ) {
        const { identity: tableName, columns, namespace: databaseID } =
          osv.tabularRecordDefn;
        const db = databaseID
          ? (this.alaSqlEngine.databases[databaseID] ||
            new this.alaSqlEngine.Database(databaseID))
          : this.alaSqlPrimeDB;
        // TODO: should this be CREATE VIEW instead?
        db.exec(`CREATE TABLE [${tableName}] (\n ${
          // use [colName] so that reserved SQL keywords can be used as column name
          Array.from(columns).map((col) => `[${String(col.identity)}]`).join(
            ",\n ", // TODO: columns are untyped for now, should they be typed?
          )
        })`);
        const viewData = await osv.dataRows();
        db.tables[tableName].data = viewData;
      }
    }
  }
}
