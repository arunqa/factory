import * as t from "../../lib/task/core.ts";
import * as ssts from "../../lib/db/sqlite-schema-ts.ts";

export class Tasks extends t.EventEmitter<{
  help(): void;
  generateDbSchemaTs(): void;
}> {
  constructor() {
    super();
    // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
    this.on("help", t.eeHelpTask(this));
    this.on("generateDbSchemaTs", () => {
      const tmpDB = "Taskfile.sqlite.db";
      ssts.sqliteSchemaTypescript(
        tmpDB,
        async (db) => {
          db.execute(await Deno.readTextFile(`publication-db-schema.sql`));
        },
        async (db, tsSourceCode) => {
          db.close();
          const generatedCodeFile = "publication-db-schema.auto.ts";
          await Deno.writeTextFile(generatedCodeFile, tsSourceCode);
          await Deno.run({ cmd: [Deno.execPath(), "fmt", generatedCodeFile] })
            .status();
          Deno.remove(tmpDB);
        },
      );
    });
  }
}

// only execute tasks if Taskfile.ts is being called as a script; otherwise
// it might be imported for tasks or other reasons and we shouldn't "run".
if (import.meta.main) {
  await t.eventEmitterCLI(Deno.args, new Tasks());
}
