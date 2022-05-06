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
      const flowMetrics = publication.state.resourcesIndex.flowMetrics();
      let svg = await Deno.readTextFile(svgSrcFile);
      svg = svg.replace(
        "${OC}",
        String(publication.config.originatorRegistry.originatorsCount()),
      );
      svg = svg.replace(
        "${IC}",
        String(flowMetrics.instantiators),
      );
      svg = svg.replace(
        "${ZC}",
        String(publication.state.resourcesIndex.memoizedProducers.size),
      );
      svg = svg.replace(
        "${MC}",
        String(publication.config.originatorRegistry.refineries.size),
      );
      svg = svg.replace(
        "${RC}",
        String(publication.state.resourcesIndex.resourcesIndex.length),
      );
      svg = svg.replace(
        "${RFC}",
        String(flowMetrics.frontmatterSuppliers),
      );
      svg = svg.replace(
        "${RMC}",
        String(flowMetrics.modelSuppliers),
      );
      svg = svg.replace(
        "${PC}",
        String(publication.state.producerStats.producers.size),
      );
      svg = svg.replace(
        "${SC}",
        String(publication.state.persistedIndex.persistedDestFiles.size),
      );
      svg = svg.replace(
        "${ResourcesMS}",
        String(publication.state.summaryMetrics?.originateDurationDurationMS) +
          "ms",
      );
      svg = svg.replace(
        "${ProducersMS}",
        String(publication.state.summaryMetrics?.renderDurationMS) + "ms",
      );
      svg = svg.replace(
        "${StaticMS}",
        String(publication.state.summaryMetrics?.persistDurationMS) + "ms",
      );
      svg = svg.replace(
        "${TotalMS}",
        String(publication.state.summaryMetrics?.totalDurationMS) + "ms",
      );
      ctx.response.body = svg;
      ctx.response.type = "svg";
    });
  }
}
