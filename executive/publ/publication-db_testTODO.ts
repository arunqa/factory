import { path } from "../../core/deps.ts";
import * as mod from "./publication-db.ts";

const moduleFsAbsPath = path.fromFileUrl(import.meta.url);

export function moduleDbFileAbsPath(): string {
  // the database file name will be the same name as this Typescript path but without the .ts
  // so, if the file is /xyz/state.db.ts then the database is /xyz/state.db
  return moduleFsAbsPath.replace(/\.[^/.]+$/, ".db");
}

Deno.test(`publication server database`, () => {
  const db = new mod.Database({
    fileName: moduleDbFileAbsPath,
    events: () => new mod.DatabaseEventEmitter(),
    transactions: (db) => db,
    autoCloseOnUnload: true,
  });
  db.dbee.on("openedDatabase", () => {
    console.info(`opened database ${db.dbStoreFsPath}`);
  });
  db.dbee.on("closedDatabase", () => {
    console.info(`closed database ${db.dbStoreFsPath}`);
    Deno.removeSync(db.dbStoreFsPath);
    console.info(`deleted ${db.dbStoreFsPath}`);
  });
  db.dbee.on("executedDDL", (result) => {
    console.info(result);
  });
  db.dbee.on("executedDML", (result) => {
    console.info(result);
  });
  db.dbee.on("executedDQL", (result) => {
    console.info(result);
  });
  db.init();
});
