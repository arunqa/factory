import * as sql from "../../../../../lib/sql/mod.ts";
import * as tmpl from "../../../../../lib/text/interpolated-template.ts";

export interface SqlStatement extends sql.SqlStatement {
  readonly description?: string;
}

export function prepareStatements() {
  const itCtx = tmpl.interpolatedTemplateContext("UA-SQL", "v0.0.1");
  const state = itCtx.prepareState(
    itCtx.prepareTsModuleExecution(import.meta.url),
  );

  // Convenient template tag for local itCtx and state. Sspecial 'SQL' name is
  // used by some VS Code extensions to do syntax highlighting.
  const SQL = (literals: TemplateStringsArray, ...expressions: unknown[]) => {
    return tmpl.interpolatedTemplate(itCtx, state)(literals, ...expressions);
  };

  const stmt = (identity: string, SQL: tmpl.InterpolatedTemplateResult) => {
    return { identity, SQL };
  };

  const result: SqlStatement[] = [
    stmt("alaSQL Show Databases", SQL`SHOW DATABASES`),
  ];
  return result;
}
