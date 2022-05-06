import { oak } from "../deps.ts";
import * as p from "../../publication.ts";
import * as s from "./static.ts";

export class FlowImageMiddlewareSupplier {
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly staticEE: s.StaticEventEmitter,
    readonly htmlEndpointURL: string,
    readonly wsPublicFsPath: string,
  ) {
    const flowSvgRelPath = "site/flow.drawio.svg";
    router.get(`${this.htmlEndpointURL}/${flowSvgRelPath}`, async (ctx) => {
      const svgSrcFile = path.join(wsPublicFsPath, flowSvgRelPath);
      let svg = await Deno.readTextFile(svgSrcFile);
      svg = svg.replace(
        "${OC}",
        String(publication.config.originatorRegistry.originatorsCount()),
      );
      svg = svg.replace(
        "${IC}",
        String(publication.state.resourcesIndex.instantiatorsCount()),
      );
      svg = svg.replace(
        "${MC}",
        String(publication.config.originatorRegistry.refineries.size),
      );
      svg = svg.replace(
        "${RC}",
        String(publication.state.resourcesIndex.resourcesIndex.length),
      );
      // TODO: should we automatically count what's in ${RF_HOME}/render/*?
      svg = svg.replace("${PC}", "8");
      svg = svg.replace(
        "${SC}",
        String(publication.state.persistedIndex.persistedDestFiles.size),
      );
      ctx.response.body = svg;
      ctx.response.type = "svg";
    });
  }
}
