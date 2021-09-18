import * as html from "../../../../render/html/mod.ts";
import * as c from "../../../../../core/std/content.ts";
import * as ldsGovn from "../../governance.ts";
import * as p from "../partial/mod.ts";

export function lightningTemplate(identity: string): ldsGovn.LightningTemplate {
  return html.htmlLayoutTemplate<
    html.HelperFunctionOrString<ldsGovn.LightningLayout>,
    ldsGovn.LightningLayout
  >(identity);
}

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const pageHeadingPartial: ldsGovn.LightningPartial = (layout) => `
${layout.activeTreeNode ? `<div class="schema-header">
  <h1 class="slds-text-heading_large">
    <strong>${layout.layoutText.title(layout)}</strong>
  </h1>
</div>`: ''}`

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const homePage = lightningTemplate("lds/page/home")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsHomePage' layout in ${import.meta.url} -->
  <head>
    ${p.typicalHeadPartial}
    ${(layout) => layout.contributions.scripts.contributions()}
    ${(layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${p.bodyAttrsPartial}>
  ${p.redirectConsoleContainerPartial}
  ${p.resourceDiagnosticsPartial}
  <header>
  ${p.contextBarPartial}
  </header>
  
  <main class="container flex slds-m-vertical_small slds-container--center"> 
    <div class="slds-container--xlarge slds-container--center">
    ${p.typicalBodyPartial}
    </div>
    ${p.layoutDiagnosticsPartial}
  </main>

  ${p.footerFixedCopyrightBuildPartial}
  ${p.typicalTailPartial}
  ${p.redirectConsolePartial}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const innerIndexPage = lightningTemplate("lds/page/inner-index")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsInnerIndexPage' layout in ${import.meta.url} -->
  <head>
    ${p.typicalHeadPartial}
    ${(layout) => layout.contributions.scripts.contributions()}
    ${(layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${p.bodyAttrsPartial}>
  ${p.redirectConsoleContainerPartial}
  ${p.resourceDiagnosticsPartial}
  <header>
  ${p.contextBarPartial}
  </header>
  
  <main class="container flex slds-m-vertical_small">
  <div class="slds-grid slds-wrap">
    <div class="slds-grid slds-grid_align-center slds-gutters_medium slds-var-m-around_medium">
      <div>
        ${p.breadcrumbsPartial}
        ${pageHeadingPartial}
        <div id="content" class="slds-m-top_x-large">
        ${p.typicalBodyPartial}
        </div>
        ${p.layoutDiagnosticsPartial}
      </div>
    </div>
  </div>
  </main>
  ${p.footerFixedCopyrightBuildPartial}
  ${p.typicalTailPartial}
  ${p.redirectConsolePartial}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const innerIndexAutoPage = lightningTemplate("lds/page/inner-index-auto")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsInnerIndexAutoPage' layout in ${import.meta.url} -->
  <head>
    ${p.typicalHeadPartial}
    ${(layout) => layout.contributions.scripts.contributions()}
    ${(layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${p.bodyAttrsPartial}>
  ${p.redirectConsoleContainerPartial}
  ${p.resourceDiagnosticsPartial}
  <header>
  ${p.contextBarPartial}
  </header>
  
  <main class="container flex slds-m-vertical_small">
  <div class="slds-grid slds-wrap">
    <div class="slds-grid slds-grid_align-center slds-gutters_medium slds-var-m-around_medium">
      <div>
        ${p.breadcrumbsWithoutTerminalPartial}
        ${pageHeadingPartial}
        <div id="content" class="slds-m-top_x-large">
        ${(layout, body) => layout.model.isContentAvailable ? p.typicalBodyPartial(layout, body) : ''}
        ${p.autoIndexCardsBodyPartial}
        </div>
        ${p.layoutDiagnosticsPartial}
      </div>
    </div>
  </div> 
  </main>
  ${p.footerFixedCopyrightBuildPartial}
  ${p.typicalTailPartial}
  ${p.redirectConsolePartial}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const noDefinitiveLayoutPage = lightningTemplate("lds/page/no-layout")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsNoDefinitiveLayoutPage' layout in ${import.meta.url} -->
  <head>
    ${p.typicalHeadPartial}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
    <title>SLDS Diagnostics</title>
  </head>
  <body${p.bodyAttrsPartial}>
    ${p.redirectConsoleContainerPartial}
    <h1>SLDS Diagnostics</h2>
    You did not choose a proper layout either programmtically or through frontmatter.
    ${p.resourceDiagnosticsPartial}
    <h2>Layout Strategy</h2>
    <pre><code class="language-js">${(layout) => c.escapeHTML(Deno.inspect(layout.layoutSS, { depth: undefined }).trimStart())}</code></pre>
    ${p.footerFixedCopyrightBuildPartial}
    ${p.typicalTailPartial}
    ${p.redirectConsolePartial}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const noDecorationPage = lightningTemplate("lds/page/no-decoration")`${p.typicalBodyPartial}`;
