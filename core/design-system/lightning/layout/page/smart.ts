import * as p from "../partial/mod.ts";
import * as t from "./typical.ts";

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const smartNavigationPage = t.lightningTemplate("lds/page/default")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsSmartNavigationPage' layout in ${import.meta.url} -->
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
      <div class="slds-col slds-size_3-of-12">
      ${p.verticalNavigationShadedPartial}
      </div>
      <div class="slds-size_7-of-12">
        <div class="slds-box_x-small  slds-m-around_x-small">
          <div class="slds-container--large slds-container--center">
          ${p.breadcrumbsPartial}
          ${t.pageHeadingPartial}
          <div id="content" class="slds-m-top_x-large">
          <article>
          ${p.typicalBodyPartial}
          </article>
          </div>
          ${p.layoutDiagnosticsPartial}
        </div>
        </div>
      </div>
      <div id="desktop-toc" class="tiktoc slds-col slds-size_2-of-12">
        <aside class="toc-container slds-is-fixed">
          <div class="toc"></div> <!-- filled in by tocbot in asideTOC -->
          <div class="slds-p-top_large">
            ${p.frontmatterTagsPartial}
          </div>          
        </aside>
      </div>
    </div>
  </div>
  </main>
  ${p.asideTocPartial}
  ${p.footerFixedCopyrightBuildPartial}
  ${p.typicalTailPartial}
  ${p.redirectConsolePartial}
  </body>
</html>`;
