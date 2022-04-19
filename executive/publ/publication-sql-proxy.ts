import * as pDB from "./publication-db.ts";
import * as p from "./publication.ts";
import * as m from "../../lib/metrics/mod.ts";
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
          await this.prepareObservabilityDB();
          await this.prepareConfigDB();
          await this.prepareResourcesDB();
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

  sqlToken(token: string) {
    // only keep characters that SQL can use as a token for table, column names
    return token.replace(/[^a-z0-9_]/gi, "").toLowerCase();
  }

  // deno-lint-ignore require-await
  async prepareConfigDB() {
    const configDB = new this.alaSqlEngine.Database("config");
    this.createJsObjectSingleRowTable(
      "prime",
      this.publication.config,
      configDB,
    );
    this.createJsObjectsTable(
      "environment",
      Array.from(Object.entries(Deno.env.toObject())).map((envEntry) => ({
        var_name: envEntry[0],
        var_value: envEntry[1],
      })),
      configDB,
    );
    this.createJsFlexibleTableFromUntypedObjectArray(
      "globalSqlDbConns",
      window.globalSqlDbConns
        ? Array.from(window.globalSqlDbConns.entries()).map((e) => {
          const [connection_name, conn] = e;
          return { connection_name, conn_pool: conn.dbConnPool };
        })
        : [{
          isLiveReloadRequest:
            this.publication.config.operationalCtx.isLiveReloadRequest,
          help: "PostgreSQL Globals being ignored during reload request",
        }],
      configDB,
    );
  }

  // deno-lint-ignore require-await
  async prepareResourcesDB() {
    const pomDB = new this.alaSqlEngine.Database("resource");
    this.createJsObjectSingleRowTable(
      "prime",
      this.publication,
      pomDB,
    );
    this.createJsFlexibleTableFromUntypedObjectArray(
      "resource",
      // deno-lint-ignore ban-types
      this.publication.state.resourcesIndex.resourcesIndex as object[],
      pomDB,
    );
    const resourceIndexes: { namespace: string; index: string }[] = [];
    for (
      const kr of this.publication.state.resourcesIndex.keyedResources.entries()
    ) {
      const [namespace, nsKeysIndex] = kr;
      for (const nsk of nsKeysIndex.entries()) {
        const [index, resources] = nsk;
        resourceIndexes.push({ namespace, index });
        this.createJsFlexibleTableFromUntypedObjectArray(
          `resource_${this.sqlToken(namespace)}_${this.sqlToken(index)}`,
          // deno-lint-ignore ban-types
          resources as object[],
          pomDB,
        );
      }
    }
    this.createJsFlexibleTableFromUntypedObjectArray(
      "resource_index",
      resourceIndexes,
      pomDB,
    );
    this.createJsObjectsTable(
      "resource_persisted",
      Array.from(this.publication.state.persistedIndex.persistedDestFiles).map(
        (entry) => ({ destFileName: entry[0], ...entry[1] }),
      ),
      pomDB,
    );
  }

  async prepareObservabilityDB() {
    const observabilityDB = new this.alaSqlEngine.Database(
      "observability",
    );
    const healthChecks = await this.publication.config.observability
      ?.serviceHealthComponentsChecks();
    if (healthChecks) {
      const records: Record<string, unknown>[] = [];
      for (const hc of Object.entries(healthChecks)) {
        const [category, checks] = hc;
        for (const check of checks) {
          records.push({ category, ...check });
        }
      }
      this.createJsObjectsTable(
        "health_check",
        records,
        observabilityDB,
      );
    }

    const pomUniversalMetrics = m.tabularMetrics(
      this.publication.config.metrics.instances,
    );
    this.createJsObjectsTable(
      "universal_metric",
      pomUniversalMetrics.metrics,
      observabilityDB,
    );
    this.createJsObjectsTable(
      "universal_metric_instance",
      pomUniversalMetrics.metricInstances,
      observabilityDB,
    );
    this.createJsObjectsTable(
      "universal_metric_label",
      pomUniversalMetrics.metricLabels,
      observabilityDB,
    );
    this.createJsObjectsTable(
      "universal_metric_instance_label",
      pomUniversalMetrics.metricInstanceLabels,
      observabilityDB,
    );

    if (this.publication.state.assetsMetrics) {
      this.createJsFlexibleTableFromUntypedArray(
        "fs_asset_metric",
        this.publication.state.assetsMetrics.pathExtnsColumns,
        this.publication.state.assetsMetrics.pathExtnsColumnHeaders,
        observabilityDB,
      );
    }
  }
}
