import { colors } from "../../../../core/deps.ts";
import { oak } from "../deps.ts";
import * as pDB from "../../publication-db.ts";
import * as p from "../../publication.ts";
import * as psp from "../../publication-sql-proxy.ts";
import * as sql from "../../../../lib/sql/mod.ts";
import * as srgd from "../../../../lib/sql/remote/guard.ts";
import * as srf from "../../../../lib/sql/remote/flexible.ts";
import * as ssi from "./workspace/inventory/server-runtime-sql-stmts.ts";
import "https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js";
import "../../../../lib/db/sql.ts"; // for window.globalSqlDbConns

declare global {
  // https://raw.githubusercontent.com/douglascrockford/JSON-js/master/cycle.js
  interface JSON {
    decycle: (o: unknown) => unknown;
    retrocycle: (o: unknown) => unknown;
  }
}

/**
 * Registers an endpoint (usually /SQL) which accepts arbitrary SQL and
 * executes it against the publication server's SQLite database which is used to
 * store access logs, errors, and other diagnostic information for the server.
 */
export class ServerRuntimeSqlProxyMiddlewareSupplier {
  readonly psp: psp.PublicationSqlProxy;
  readonly inventory = ssi.typicalSqlStmtsInventory();

  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly database: pDB.PublicationDatabase | undefined,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    this.psp = new psp.PublicationSqlProxy(
      publication,
      database,
      this.inventory,
    );

    if (this.database) {
      router.post(`${this.htmlEndpointURL}/publ/DQL`, async (ctx) => {
        try {
          const body = ctx.request.body();
          const payload = await body.value;
          if (srgd.isForeignSqlSelectStmtSupplier(payload)) {
            const resultNature: psp.ResultNature =
              psp.isResultNatureSupplier(payload)
                ? payload.resultNature
                : "matrix";
            switch (resultNature) {
              case "matrix":
                this.prepareSqlResultJsonResponse(
                  ctx,
                  (await this.database!.rowsDQL(payload.SQL)).rows,
                  resultNature,
                );
                break;
              default:
                this.prepareSqlResultJsonResponse(
                  ctx,
                  (await this.database!.recordsDQL(payload.SQL)).records,
                  resultNature,
                );
                break;
            }
          }
        } catch (error) {
          ctx.response.body = JSON.stringify({ error: Deno.inspect(error) });
        }
      });
    } else {
      router.post(`${this.htmlEndpointURL}/publ/DQL`, (ctx) => {
        ctx.response.body = JSON.stringify({
          error: "pubctl SQLite database not supplied",
        });
      });
    }

    const alaSqlProxyEndpointURL = `${this.htmlEndpointURL}/asp`;
    router.get(`${alaSqlProxyEndpointURL}(.*)`, async (ctx) => {
      const sqlStmtIdentity = ctx.request.url.pathname.substring(
        alaSqlProxyEndpointURL.length + 1, // +1 is because we don't want a leading /
      );
      await this.executeForeignSQL({ qualifiedName: sqlStmtIdentity }, ctx);
    });

    router.post(
      alaSqlProxyEndpointURL,
      async (ctx) => {
        const body = ctx.request.body();
        let json: unknown;
        switch (body.type) {
          case "json":
            json = await body.value;
            if (srf.isForeignSqlStmtPayload(json)) {
              await this.executeForeignSQL(json, ctx);
            }
            break;

          case "text":
            // treat the entire text body as our SQL
            await this.executeForeignSQL({ SQL: await body.value }, ctx);
            break;

          default:
            ctx.response.body = JSON.stringify({
              error: "unable to handle body type" + body.type,
            });
        }
      },
    );
  }

  prepareSqlResultJsonResponse(
    ctx: oak.Context,
    value: unknown,
    sqlResultNature: string,
  ) {
    ctx.response.headers.set("sql-result-nature", sqlResultNature);
    ctx.response.body = JSON.stringify(JSON.decycle(value));
  }

  async executeForeignSQL(
    payload: srf.ForeignSqlStmtPayload,
    oakCtx: oak.Context,
  ) {
    const resultNature: psp.ResultNature = psp.isResultNatureSupplier(payload)
      ? payload.resultNature
      : "model";
    let efspResult:
      | srf.ExecuteSqlProxyResult<
        // deno-lint-ignore no-explicit-any
        sql.QueryExecutionRecordsSupplier<sql.SqlRecord> | { alaSqlExec: any }
      >
      | undefined = undefined;
    try {
      efspResult = await this.psp.executeForeignSqlPayload(
        payload,
        resultNature,
        (startInit, endInit) => {
          if (startInit && !endInit) {
            Deno.stdout.write(
              new TextEncoder().encode(colors.dim("Preparing SQL proxies...")),
            );
          } else {
            console.log(
              colors.dim(
                `done (${new Date().getTime() - startInit.getTime()}ms)`,
              ),
            );
          }
        },
      );

      if (oakCtx.request.url.searchParams.has("diagnose")) {
        // if diagnostics are requested we just return the payload and full result
        this.prepareSqlResultJsonResponse(oakCtx, {
          payload,
          efspResult,
        }, "diagnostics");
        return;
      }
      if (efspResult.error) {
        this.prepareSqlResultJsonResponse(oakCtx, {
          payload,
          inventory: Array.from(this.inventory.sqlStmtIdentities()),
          databases: this.psp.databases.map((db) => db.identity),
          efspResult,
        }, "error");
      } else {
        if (efspResult.proxyResult && efspResult.proxyResult.data) {
          const prData = efspResult.proxyResult.data;
          if (sql.isQueryExecutionRecordsSupplier(prData)) {
            this.prepareSqlResultJsonResponse(
              oakCtx,
              resultNature == "model"
                ? sql.detectQueryResultModel(prData.records)
                : prData.records,
              resultNature,
            );
          } else {
            this.prepareSqlResultJsonResponse(
              oakCtx,
              prData.alaSqlExec, // usually supplied with no-decoration
              resultNature, // usually supplied with no-decoration
            );
          }
        } else {
          this.prepareSqlResultJsonResponse(oakCtx, {
            error: "efspResult.proxyResult or proxyResult.data missing",
            payload,
            inventory: Array.from(this.inventory.sqlStmtIdentities()),
            databases: this.psp.databases.map((db) => db.identity),
            efspResult,
          }, "error");
        }
      }
    } catch (error) {
      this.prepareSqlResultJsonResponse(oakCtx, {
        error: Deno.inspect(error),
        payload,
        efspResult,
        inventory: Array.from(this.inventory.sqlStmtIdentities()),
        databases: this.psp.databases.map((db) => db.identity),
      }, "error");
    }
  }
}
