import { path } from "../../core/deps.ts";
import * as sql from "../../lib/sql/mod.ts";
import * as sqlite from "../../lib/sqlite/mod.ts";
import * as s from "./server/middleware/static.ts";
import * as pdbs from "./publication-db-schema.auto.ts";

const moduleHome = path.dirname(path.fromFileUrl(import.meta.url));

export class PublicationDatabase
  extends sqlite.SqliteDatabase<sql.SqlEventEmitter> {
  activeHost?: pdbs.PublHost;
  activeBuildEvent?: pdbs.PublBuildEvent;
  activeServerService?: pdbs.PublServerService;

  init() {
    // deno-lint-ignore require-await
    this.dbee.on("constructStorage", async () => {
      this.dbStore.execute(
        Deno.readTextFileSync(
          path.join(moduleHome, "publication-db-schema.sql"),
        ),
      );
    });

    this.dbee.on("populateSeedData", async () => {
      this.activeHost = await this.insertedRecord<
        pdbs.publ_host_insertable,
        pdbs.PublHost
      >(
        { host: Deno.hostname(), mutation_count: 0 },
        "publ_host",
        {
          insertSQL: (suggestedSQL, values, names) => {
            return `${
              suggestedSQL(names, values)
            } ON CONFLICT(host) DO UPDATE SET mutation_count=mutation_count+1`;
          },
          // we supply our own SQL; in case of ON CONFLICT the insert won't occur
          // so the normal last_insert_rowid() won't work
          afterInsertSQL: (_suggestedSQL, insert) => {
            return ["SELECT * from publ_host where host = :host", {
              host: insert.host,
            }];
          },
          transformInserted: (record) =>
            pdbs.transformPublHost.fromTable(
              record as unknown as pdbs.mutable_publ_host,
            ),
        },
      );
    });

    super.init();
  }

  async persistStaticServed(
    sat: s.StaticServedTarget,
  ): Promise<
    | sql.QueryExecutionRowsSupplier
    | sql.QueryExecutionRecordsSupplier
  > {
    const result = await this.rowsDML(
      `INSERT INTO publ_server_static_access_log
                   (publ_server_service_id, status, asset_nature, location_href, filesys_target_path, filesys_target_symlink)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [
        this.activeServerService?.publServerServiceId,
        sat.status,
        sat.extn,
        sat.locationHref,
        sat.fsTarget,
        sat.fsTargetSymLink,
      ],
    );
    return result;
  }

  async persistBuildEvent(
    pbe: Omit<pdbs.PublBuildEventInsertable, "publHostId">,
  ) {
    if (!this.activeHost) {
      console.error(
        `[PublicationDatabase] persistBuildEvent should not be called without an activeHost`,
      );
      return;
    }

    const insert: pdbs.publ_build_event_insertable = pdbs
      .transformPublBuildEvent.insertable({
        ...pbe,
        publHostId: this.activeHost.publHostId,
      });
    this.activeBuildEvent = await this.insertedRecord<
      pdbs.publ_build_event_insertable,
      pdbs.PublBuildEvent
    >(insert, pdbs.transformPublBuildEvent.tableName, {
      transformInserted: (record) =>
        pdbs.transformPublBuildEvent.fromTable(
          record as unknown as pdbs.mutable_publ_build_event,
        ),
      onNotInserted: (insert, _names, _SQL, insertErr) => {
        console.dir(insert);
        console.dir(insertErr);
        return undefined;
      },
    });
    return this.activeBuildEvent;
  }

  async persistServerService(
    ss: Omit<pdbs.PublServerServiceInsertable, "publBuildEventId">,
  ) {
    if (!this.activeBuildEvent) {
      console.error(
        `[PublicationDatabase] persistServerService should not be called without an activeBuildEvent`,
      );
      return;
    }

    const insert: pdbs.publ_server_service_insertable = pdbs
      .transformPublServerService.insertable({
        ...ss,
        publBuildEventId: this.activeBuildEvent.publBuildEventId,
      });
    this.activeServerService = await this.insertedRecord<
      pdbs.publ_server_service_insertable,
      pdbs.PublServerService
    >(insert, pdbs.transformPublServerService.tableName, {
      transformInserted: (record) =>
        pdbs.transformPublServerService.fromTable(
          record as unknown as pdbs.mutable_publ_server_service,
        ),
      onNotInserted: (insert, _names, _SQL, insertErr) => {
        console.dir(insert);
        console.dir(insertErr);
        return undefined;
      },
    });
    return this.activeServerService;
  }

  async persistServerError(
    err: Omit<pdbs.PublServerErrorLogInsertable, "publServerServiceId">,
  ) {
    if (!this.activeServerService) {
      console.error(
        `[PublicationDatabase] persistServerService should not be called without an activeServerService`,
      );
      return undefined;
    }

    const insert: pdbs.publ_server_error_log_insertable = pdbs
      .transformPublServerErrorLog.insertable({
        ...err,
        publServerServiceId: this.activeServerService.publServerServiceId,
      });
    const logged = await this.insertedRecord<
      pdbs.publ_server_error_log_insertable,
      pdbs.PublServerErrorLog
    >(insert, pdbs.transformPublServerErrorLog.tableName, {
      transformInserted: (record) =>
        pdbs.transformPublServerErrorLog.fromTable(
          record as unknown as pdbs.publ_server_error_log,
        ),
      onNotInserted: (insert, _names, _SQL, insertErr) => {
        console.dir(insert);
        console.dir(insertErr);
        return undefined;
      },
    });
    return { tableName: pdbs.transformPublServerErrorLog.tableName, logged };
  }
}
