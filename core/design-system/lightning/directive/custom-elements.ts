import * as govn from "../../../../governance/mod.ts";
import * as mdr from "../../../render/markdown/markdown.ts";

export type LightningCustomElementMarkdownDirective =
  & govn.DirectiveExpectation<
    mdr.MarkdownClientCustomElementDirective,
    void
  >
  & mdr.MarkdownClientCustomElementDirective;

// Markdown Web Component Directives are handled at client time so won't be
// "encountered" on the server side so this is an empty function for now.
// TODO: we might want to track these in the future for diagnostics, though.
const encountered = () => {};

export const agGridCE: LightningCustomElementMarkdownDirective = {
  identity: "ag-grid",
  present: "inline",
  name: "ag-grid",
  tag: "ag-grid",
  allowedAttrs: ["configHref", "domLayout"],
  encountered,
};

export const apacheEChartsCE: LightningCustomElementMarkdownDirective = {
  identity: "apache-echarts",
  present: "inline",
  name: "apache-echarts",
  tag: "apache-echarts",
  allowedAttrs: ["configHref"],
  encountered,
};

export const chartJsCE: LightningCustomElementMarkdownDirective = {
  identity: "chart-js",
  present: "inline",
  name: "chart-js",
  tag: "chart-js",
  allowedAttrs: ["configHref"],
  encountered,
};

export const krokiCE: LightningCustomElementMarkdownDirective = {
  identity: "kroki-diagram",
  present: "block",
  name: "kroki-diagram",
  tag: "kroki-diagram",
  allowedAttrs: ["type", "host", "output", "diagnose"],
  encountered,
};

export const markmapCE: LightningCustomElementMarkdownDirective = {
  identity: "markmap",
  present: "block",
  name: "markmap",
  tag: "markmap-diagram",
  allowedAttrs: ["diagnose"],
  encountered,
};

export const timeAgoCE: LightningCustomElementMarkdownDirective = {
  identity: "time-ago",
  present: "inline",
  name: "time-ago",
  tag: "time-ago",
  allowedAttrs: ["date"],
  encountered,
};

export const allCustomElements: LightningCustomElementMarkdownDirective[] = [
  agGridCE,
  apacheEChartsCE,
  chartJsCE,
  krokiCE,
  markmapCE,
  timeAgoCE,
];

export default allCustomElements;
