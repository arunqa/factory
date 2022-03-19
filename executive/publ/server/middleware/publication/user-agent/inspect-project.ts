import { ServerUserAgentContext } from "../../../governance.ts";
import { humanPath } from "../../../../../../lib/text/human.ts";
import * as wse from "../../workspace/ua-editable.ts";

interface Inspectable {
  readonly identity: string;
  readonly value: (humainze?: number) => string;
  readonly HTML: (humanize?: number) => string;
}

interface InspectionResult {
  readonly properties: Inspectable[];
}

export function projectInspection(
  ctx: ServerUserAgentContext,
): InspectionResult {
  return {
    properties: [
      {
        identity: "Project Home",
        value: (humanize) => {
          const home = ctx.project.publFsEntryPath("/", true);
          return humanize ? humanPath(home, humanize) : home;
        },
        HTML: (humanize) => {
          const home = ctx.project.publFsEntryPath("/", true);
          return humanize ? humanPath(home, humanize) : home;
        },
      },
      {
        identity: "Factory Home",
        value: (humanize) => {
          const home = ctx.project.factoryFsEntryPath("/", true);
          return humanize ? humanPath(home, humanize) : home;
        },
        HTML: (humanize) => {
          const home = ctx.project.factoryFsEntryPath("/", true);
          return humanize ? humanPath(home, humanize) : home;
        },
      },
      {
        identity: "Environment",
        value: (humanize) => {
          const envrc = ctx.project.publFsEntryPath("/.envrc", true);
          return humanize ? humanPath(envrc, humanize) : envrc;
        },
        HTML: (humanize) => {
          return wse.editableFileRefHTML(
            ctx.project.publFsEntryPath("/.envrc", true),
            humanize,
          );
        },
      },
    ],
  };
}

export default projectInspection;
