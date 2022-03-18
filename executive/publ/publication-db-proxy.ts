import { oak } from "./deps.ts";
import * as safety from "../../lib/safety/mod.ts";
import * as pDB from "./publication-db.ts";

export const firstWordRegEx = /^\s*([a-zA-Z0-9]+)/;

export const isSelectStatement = (candidateSQL: string) => {
  const firstWordMatch = candidateSQL.match(firstWordRegEx);
  if (firstWordMatch && firstWordMatch.length > 1) {
    const firstWord = firstWordMatch[1].toUpperCase();
    if (firstWord == "SELECT") return true;
  }
  return false;
};

export interface SqlSupplier {
  readonly SQL: string;
}

const isSqlSupplier = safety.typeGuard<SqlSupplier>("SQL");

export interface RowNatureSupplier {
  readonly rowNature: "rows" | "records";
}

const isRowNatureSupplier = safety.typeGuard<RowNatureSupplier>("rowNature");

export interface SqlSelectRequest extends SqlSupplier {
  readonly contentType?: "JSON" | "CSV";
}

export function isDatabaseProxySqlSelectService(
  o: unknown,
): o is SqlSelectRequest {
  if (isSqlSupplier(o)) {
    if (isSelectStatement(o.SQL)) return true;
  }
  return false;
}

/**
 * Registers an endpoint (usually /SQL/unsafe) which accepts arbitrary SQL and
 * executes it against the publication server's SQLite database which is used to
 * store access logs, errors, and other diagnostic information for the server.
 */
export class DatabaseProxyMiddlewareSupplier {
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly database: pDB.PublicationDatabase,
    readonly htmlEndpointURL: string,
  ) {
    router.post(this.htmlEndpointURL, async (ctx) => {
      const body = ctx.request.body();
      const payload = await body.value;
      if (isDatabaseProxySqlSelectService(payload)) {
        const rowNature = isRowNatureSupplier(payload)
          ? payload.rowNature
          : "rows";
        const result = rowNature == "rows"
          ? this.database.rowsDQL(payload.SQL)
          : this.database.recordsDQL(payload.SQL);
        ctx.response.body = JSON.stringify(result);
      }
    });
  }
}
