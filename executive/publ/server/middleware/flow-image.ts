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
      svg = svg.replaceAll(
        "${OC}",
        String(publication.config.originatorRegistry.originatorsCount()),
      );
      svg = svg.replaceAll(
        "${IC}",
        String(flowMetrics.instantiators),
      );
      svg = svg.replaceAll(
        "${ZC}",
        String(publication.state.resourcesIndex.memoizedProducers.size),
      );
      svg = svg.replaceAll(
        "${MC}",
        String(publication.config.originatorRegistry.refineries.size),
      );
      svg = svg.replaceAll(
        "${RC}",
        String(publication.state.resourcesIndex.resourcesIndex.length),
      );
      svg = svg.replaceAll(
        "${RFC}",
        String(flowMetrics.frontmatterSuppliers),
      );
      svg = svg.replaceAll(
        "${RMC}",
        String(flowMetrics.modelSuppliers),
      );
      svg = svg.replaceAll(
        "${PC}",
        String(publication.state.producerStats.producers.size),
      );
      svg = svg.replaceAll(
        "${SC}",
        String(publication.state.persistedIndex.persistedDestFiles.size),
      );
      svg = svg.replaceAll(
        "${ResourcesMS}",
        String(publication.state.summaryMetrics?.originateDurationDurationMS) +
          "ms",
      );
      svg = svg.replaceAll(
        "${ProducersMS}",
        String(publication.state.summaryMetrics?.renderDurationMS) + "ms",
      );
      svg = svg.replaceAll(
        "${StaticMS}",
        String(publication.state.summaryMetrics?.persistDurationMS) + "ms",
      );
      svg = svg.replaceAll(
        "${TotalMS}",
        String(publication.state.summaryMetrics?.totalDurationMS) + "ms",
      );
      ctx.response.body = svg;
      ctx.response.type = "svg";
    });
  }
}
