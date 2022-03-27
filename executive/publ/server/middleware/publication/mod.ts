import { oak } from "../../deps.ts";
import * as p from "../../../publication.ts";
import * as rJSON from "../../../../../core/content/routes.json.ts";
import * as pDB from "../../../publication-db.ts";
import * as rflPath from "../../../../../lib/path/mod.ts";
import "../../../../../lib/db/sql.ts"; // for window.globalSqlDbConns

import "./user-agent/inspect-project.ts"; // for type-checking only (user agent is TS -> JS compiled)

const modulePath = rflPath.pathRelativeToModuleCWD(import.meta.url);

export class PublicationMiddlewareSupplier {
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly serverStateDB: pDB.PublicationDatabase | undefined,
    readonly htmlEndpointURL: string,
    readonly registerTsJsRoute: (
      endpointWithoutExtn: string,
      tsSrcRootSpecifier: string,
    ) => void,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    router.get(`${this.htmlEndpointURL}/inspect/project.json`, (ctx) => {
      const projectRootPath = publication.config.operationalCtx.projectRootPath;
      const resp = {
        projectHome: projectRootPath("/", true),
        envrc: projectRootPath("/.envrc", true),
      };
      ctx.response.body = JSON.stringify(resp);
    });

    this.registerTsJsRoute(
      `${this.htmlEndpointURL}/inspect/project`,
      modulePath("./user-agent/inspect-project.ts"),
    );

    router.get(`${this.htmlEndpointURL}/inspect/design-system.json`, (ctx) => {
      ctx.response.body = JSON.stringify(publication.ds.designSystem);
    });

    router.get(`${this.htmlEndpointURL}/inspect/renderers.json`, (ctx) => {
      const renderers = [];
      for (
        const layout of publication.ds.designSystem.layoutStrategies.layouts
          .values()
      ) {
        renderers.push(layout);
      }
      ctx.response.body = JSON.stringify(renderers);
    });

    router.get(`${this.htmlEndpointURL}/inspect/routes.json`, (ctx) => {
      ctx.response.body = JSON.stringify(
        this.publication.state.resourcesTree,
        rJSON.routeTreeJsonReplacer,
      );
    });

    router.get(
      `${this.htmlEndpointURL}/inspect/databases/content.json`,
      (ctx) => {
        const dbAccesses = window.globalSqlDbConns
          ? Array.from(window.globalSqlDbConns.entries())
          : [];

        ctx.response.body = JSON.stringify(
          dbAccesses,
          (_key, value) => typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
        );
      },
    );

    router.get(
      `${this.htmlEndpointURL}/inspect/databases/server.json`,
      (ctx) => {
        ctx.response.body = JSON.stringify({
          sqliteFileName: this.serverStateDB
            ? this.serverStateDB.dbStoreFsPath
            : `this.serverStateDB not provided`,
        });
      },
    );
  }
}
