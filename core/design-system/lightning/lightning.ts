import { fs, path, safety } from "../../deps.ts";
import * as govn from "../../../governance/mod.ts";
import * as html from "../../render/html/mod.ts";
import * as c from "../../../core/std/content.ts";
import * as r from "../../../core/std/resource.ts";
import * as m from "../../../core/std/model.ts";
import * as fm from "../../../core/std/frontmatter.ts";
import * as ldsGovn from "./governance.ts";
import * as l from "./layout/mod.ts";
import * as route from "../../../core/std/route.ts";
import * as rtree from "../../../core/std/route-tree.ts";
import * as render from "../../../core/std/render.ts";
import * as nature from "../../../core/std/nature.ts";
import * as persist from "../../../core/std/persist.ts";

export function lightningTemplate(identity: string): ldsGovn.LightningTemplate {
  return html.htmlLayoutTemplate<
    html.HelperFunctionOrString<ldsGovn.LightningLayout>,
    ldsGovn.LightningLayout
  >(identity);
}

export type IconName = string;
export type IconCollectionName = string;
export type IconIdentity = string | {
  readonly collection: IconCollectionName;
  readonly name: IconName;
};

export function renderedIcon(
  layout: ldsGovn.LightningLayout,
  identity: IconIdentity,
): string {
  const collection = typeof identity === "string"
    ? "utility"
    : identity.collection;
  const name = typeof identity === "string" ? identity : identity.name;
  const sprite = layout.assets.ldsIcons(
    `/${collection}-sprite/svg/symbols.svg#${name}`,
  );
  // deno-fmt-ignore
  return `<svg class="slds-icon slds-icon_small" aria-hidden="true"><use href="${sprite}"></use></svg>`
}

export function renderedButtonIcon(
  layout: ldsGovn.LightningLayout,
  identity: IconIdentity,
): string {
  const collection = typeof identity === "string"
    ? "utility"
    : identity.collection;
  const name = typeof identity === "string" ? identity : identity.name;
  const sprite = layout.assets.ldsIcons(
    `/${collection}-sprite/svg/symbols.svg#${name}`,
  );
  // deno-fmt-ignore
  return `<svg class="slds-button__icon slds-button__icon_hint slds-button__icon_small" aria-hidden="true"><use href="${sprite}"></use></svg>`
}

export function renderedIconContainer(
  layout: ldsGovn.LightningLayout,
  identity: IconIdentity,
): string {
  const collection = typeof identity === "string"
    ? "utility"
    : identity.collection;
  const name = typeof identity === "string" ? identity : identity.name;
  // deno-fmt-ignore
  return `<span class="slds-icon_container slds-icon-${collection}-${name}">${ renderedIcon(layout, identity) }</span>`
}

export type CardTitleLink = string;
export type CardTitle = string;
export type CardBody = string;

export interface Card {
  readonly title: CardTitle;
  readonly icon?: IconIdentity;
  readonly href?: CardTitleLink;
  readonly body?: CardBody;
}

export function renderedCard(
  layout: ldsGovn.LightningLayout,
  card: Card,
): string {
  // deno-fmt-ignore
  return `<article class="slds-card slds-var-m-around_small">
    <div class="slds-card__header slds-grid">
      <header class="slds-media slds-media_center slds-has-flexi-truncate">
        ${card.icon? `<div class="slds-media__figure">
          <span class="slds-icon_container slds-icon-standard-account" title="account">
            ${renderedIcon(layout, card.icon)}
            <span class="slds-assistive-text">{c.title}</span>
          </span>
        </div>` : ''}        
        <div class="slds-media__body">
          <h2 class="slds-card__header-title">
            <a href="${card.href}" class="slds-card__header-link slds-truncate" title="${card.title}">
              <span>${card.title}</span>
            </a>
          </h2>
        </div>
      </header>
    </div>
    ${card.body ? `<div class="slds-card__body slds-card__body_inner">${card.body}</div>` : ''}
    </article>`
}

export const ldsContextBar: ldsGovn.LightningPartial = (_, layout) => {
  const cbs = layout.branding.contextBarSubject;
  const subject = typeof cbs === "function" ? cbs(layout, layout.assets) : cbs;
  let subjectLabel, subjectHref;
  if (typeof subject === "string") {
    subjectLabel = subject;
    subjectHref = layout.navigation.home;
  } else {
    subjectLabel = subject[0];
    subjectHref = subject[1];
  }
  const cbsis = layout.branding.contextBarSubjectImageSrc;
  const subjectImgSrc = typeof cbsis === "function"
    ? cbsis(layout.assets, layout)
    : cbsis;
  let subjectImgSrcText, subjectImgSrcHref;
  if (typeof subjectImgSrc === "string") {
    subjectImgSrcText = subjectImgSrc;
    subjectImgSrcHref = subjectHref;
  } else {
    subjectImgSrcText = subjectImgSrc[0];
    subjectImgSrcHref = subjectImgSrc[1];
  }
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return `
  <!-- Primary Navigation (see https://www.lightningdesignsystem.com/components/global-navigation) -->
  ${layout.navigation.routeTree ? `
  <div class="slds-context-bar">
    <div class="slds-context-bar__primary">
      <div class="slds-context-bar__icon-action">
        <a href="${subjectImgSrcHref}"><img src="${subjectImgSrcText}" alt="" class="site-brand-prime-logo"></a>
      </div>
      <span class="slds-context-bar__label-action slds-context-bar__app-name">
        <span class="slds-truncate" title="${subjectLabel}"><a href="${subjectHref}">${subjectLabel}</a></span>
      </span>
    </div>
    <nav class="slds-context-bar__primary" role="navigation">
      <ul class="slds-grid">
        ${layout.navigation.contextBarItems(layout).map(item => { return `
        <li class="slds-context-bar__item${layout.activeRoute?.inRoute(item) ? ' slds-is-active' : ''}">
          <a href="${layout.navigation.location(item)}" class="slds-context-bar__label-action" ${item.hint ? `title="${item.hint}"` : '' }">
            <span class="slds-truncate"${item.hint ? ` title="${item.hint}"` : '' }>${item.label}</span>
          </a>
        </li>`}).join("\n")}
      </ul>
    </nav>
  </div>` : '<!-- contextBar: No ctx, state, or route tree -->'}`
};

export const ldsFooterFixedCopyrightBuild: ldsGovn.LightningPartial = () => {
  // we hide the footer using display:none and then stickyFooter() in lightning.js will display it in the proper place
  return `<footer class="footer font-size-medium" style="position: absolute; bottom: 0; height: 60px; margin-top: 40px; width: 100%; display:none;">
    <div class="slds-container_x-large slds-container_center slds-p-left_small slds-p-right_small">      
      <article class="slds-text-align_center slds-p-top_small slds-p-bottom_large">
        <p class="slds-text-body_small">© 1997-<script>document.write(new Date().getFullYear())</script> Netspective Media LLC. All Rights Reserved.</p>
        <p class="slds-text-body_small">Built on ${new Date()}</p>        
      </article>
    </div>
  </footer>`;
};

export function ldsRouteTree(
  node: govn.RouteTreeNode | undefined,
  layout: ldsGovn.LightningLayout,
  level = 0,
): string {
  // deno-fmt-ignore
  return node ? `<ul role="group">
    ${node.children.map(rtn => {
      const caption = rtn.label;
      // deno-fmt-ignore
      return `<li aria-expanded="true" aria-level="${level}"${(layout.activeTreeNode && rtn.qualifiedPath == layout.activeTreeNode.qualifiedPath) ? ' aria-selected="true" ' : ''}role="treeitem" tabindex="0">
      <div class="slds-tree__item">
          <button class="slds-button slds-button_icon slds-m-right_x-small slds-hidden" aria-hidden="true" tabindex="-1" title="Expand ${caption}">
              ${renderedButtonIcon(layout, "chevronright")}
              <span class="slds-assistive-text">Expand ${caption}</span>
          </button>
          <span class="slds-tree__item-label" title="${rtn.hint || caption}"><a href="${layout.navigation.location(rtn)}">${caption}<a/></span>
      </div>
      ${rtn.children.length > 0 ? ldsRouteTree(rtn, layout, level+1) : '<!-- leaf node -->'}
    </li>`}).join("\n")}
  </ul>` : `<!-- node not provided -->`;
}

export const ldsContentTree: ldsGovn.LightningPartial = (_, layout) => {
  const contentTree = layout.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree ? `<div class="slds-box slds-box_x-small slds-text-align_center slds-m-around_x-small">
    <aside class="content-tree">
    <div class="slds-tree_container">
      <h4 class="slds-tree__group-header" id="treeheading">${contentTree.label}</h4>
      <ul aria-labelledby="treeheading" class="slds-tree" role="tree">
      ${ldsRouteTree(contentTree, layout)} 
      <ul>
    </div>
    </aside>
    </div>` : `<!-- no contentTree -->`
};

export const ldsVerticalNavigation: ldsGovn.LightningPartial = (_, layout) => {
  const contentTree = layout.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree ? `<nav class="slds-nav-vertical" aria-label="Sub page">
    <div class="slds-nav-vertical__section">
      <h2 id="entity-header" class="slds-nav-vertical__title">${contentTree.label}</h2>
      <ul aria-describedby="entity-header">        
        ${contentTree.children.map(rtn => {
          const isActive = layout.activeTreeNode && rtn.qualifiedPath == layout.activeTreeNode.qualifiedPath;
          return `<li class="slds-nav-vertical__item ${isActive ? 'slds-is-active' : ''}">
            <a href="${layout.navigation.location(rtn)}" class="slds-nav-vertical__action"${isActive ? ' aria-current="true"' : ''}>${rtn.label}</a>
          </li>`;
        }).join('\n')}
      </ul>
    </div>
  </nav>` : `<!-- no vertical navigation -->`
};

export const ldsVerticalNavigationShaded: ldsGovn.LightningPartial = (
  _,
  layout,
) => {
  const contentTree = layout.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree ? `<div class="content-tree" style="background-color:#FAFAFB">
    <div class="slds-nav-vertical__section">
      <div>
      <fieldset class="slds-nav-vertical slds-nav-vertical_compact slds-nav-vertical_shade">
        <legend class="slds-nav-vertical__title">${contentTree.label}</legend>               
        ${contentTree.children.map(rtn => {
          const isActive = layout.activeTreeNode && rtn.qualifiedPath == layout.activeTreeNode.qualifiedPath;
          const notification = layout.navigation?.notification(rtn);
          return `<span class="slds-nav-vertical__item">
            <input type="radio" id="unique-id-03-recent" value="unique-id-03-recent" name="unique-id-shade"${isActive ? ' checked=""' : ''} />
            <label class="slds-nav-vertical__action" for="unique-id-03-recent">
              <a href="${layout.navigation.location(rtn)}">
                <span class="slds-nav-vertical_radio-faux">${rtn.label}</span>               
              </a>
              ${notification ? `<span class="slds-badge slds-col_bump-left">
                <span class="slds-assistive-text">:</span>${notification.count}
                ${notification.assistiveText ? `<span class="slds-assistive-text">${notification.assistiveText}</span>` : ''}
              </span>` : '<!-- no notifications -->'}
            </label>
          </span>`;
        }).join('\n')}                
      </fieldset>
      </div>
    </div> 
  </div>` : `<!-- no vertical shaded navigation -->`
};

export const ldsAutoIndexCardsBody: ldsGovn.LightningPartial = (_, layout) => {
  const contentTree = layout.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree
    ? `<div class="slds-grid slds-wrap slds-var-m-around_medium">        
        ${contentTree.children.filter(rtn => rtn !== layout.activeTreeNode).map(rtn => `
        <div class="slds-col slds-size_1-of-2 slds-order_2">
          ${renderedCard(layout, {
            icon: { collection: "utility", name: "assignment" },
            title: rtn.label,
            href: layout.navigation.location(rtn),
          })}
        </div>`).join('\n')}
      </div>`
    : `<!-- no index cards -->`;
};

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsBreadcrumbs: ldsGovn.LightningPartial = (_, layout) => `
${layout?.activeRoute ?
`<!-- Breadcrumbs Navigation (see https://www.lightningdesignsystem.com/components/breadcrumbs/) -->
<nav role="navigation" aria-label="Breadcrumbs">
  <ol class="slds-breadcrumb slds-list_horizontal slds-wrap">
    ${layout?.activeTreeNode?.ancestors.reverse().map(r => {
      return r.qualifiedPath == layout.activeTreeNode?.qualifiedPath ? '' : `<li class="slds-breadcrumb__item"><a href="${layout.navigation.location(r)}">${r.label}</a></li>`
    }).join("\n")} 
  </ol>
</nav>`: '<!-- no breadcrumbs -->'}`

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsBreadcrumbsWithoutTerminal: ldsGovn.LightningPartial = (_, layout) => `
${layout?.activeRoute ?
`<!-- Breadcrumbs Navigation (see https://www.lightningdesignsystem.com/components/breadcrumbs/) -->
<nav role="navigation" aria-label="Breadcrumbs">
  <ol class="slds-breadcrumb slds-list_horizontal slds-wrap">
    ${layout?.activeTreeNode?.ancestors.slice(1).reverse().map(r => {
      return r.qualifiedPath == layout.activeTreeNode?.qualifiedPath ? '' : `<li class="slds-breadcrumb__item"><a href="${layout.navigation.location(r)}">${r.label}</a></li>`
    }).join("\n")} 
  </ol>
</nav>`: '<!-- no breadcrumbs -->'}`

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsPageHeading: ldsGovn.LightningPartial = (_, layout) => `
${layout.activeTreeNode ? `<div class="schema-header">
  <h1 class="slds-text-heading_large">
    <strong>${layout.layoutText.title(layout)}</strong>
  </h1>
</div>`: ''}`

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsSmartNavigationPage = lightningTemplate("lds/page/default")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsSmartNavigationPage' layout in ${import.meta.url} -->
  <head>
    ${l.lightningHead}
    ${(_, layout) => layout.contributions.scripts.contributions()}
    ${(_, layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${l.lightningBodyAttrs}>
  ${l.ldsRedirectConsoleContainer}
  ${l.ldsResourceDiagnostics}
  <header>
  ${ldsContextBar}
  </header>
  
  <main class="container flex slds-m-vertical_small"> 
  <div class="slds-grid slds-wrap">
    <div class="slds-grid slds-grid_align-center slds-gutters_medium slds-var-m-around_medium">
      <div class="slds-col slds-size_3-of-12">
      ${ldsVerticalNavigationShaded}
      </div>
      <div class="slds-size_7-of-12">
        <div class="slds-box_x-small  slds-m-around_x-small">
          <div class="slds-container--large slds-container--center">
          ${ldsBreadcrumbs}
          ${ldsPageHeading}
          <div id="content" class="slds-m-top_x-large">
          <article>
          ${l.lightningBody}
          </article>
          </div>
          ${l.ldsLayoutDiagnostics}
        </div>
        </div>
      </div>
      <div id="desktop-toc" class="tiktoc slds-col slds-size_2-of-12">
        <aside class="toc-container slds-is-fixed">
          <div class="toc"></div> <!-- filled in by tocbot in asideTOC -->
          <div class="slds-p-top_large">
            ${l.frontmatterTags}
          </div>          
        </aside>
      </div>
    </div>
  </div>
  </main>
  ${l.asideTOC}
  ${ldsFooterFixedCopyrightBuild}
  ${l.lightningTail}
  ${l.ldsRedirectConsole}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsHomePage = lightningTemplate("lds/page/home")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsHome' layout in ${import.meta.url} -->
  <head>
    ${l.lightningHead}
    ${(_, layout) => layout.contributions.scripts.contributions()}
    ${(_, layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${l.lightningBodyAttrs}>
  ${l.ldsRedirectConsoleContainer}
  ${l.ldsResourceDiagnostics}
  <header>
  ${ldsContextBar}
  </header>
  
  <main class="container flex slds-m-vertical_small slds-container--center"> 
    <div class="slds-container--xlarge slds-container--center">
    ${l.lightningBody}
    </div>
    ${l.ldsLayoutDiagnostics}
  </main>

  ${ldsFooterFixedCopyrightBuild}
  ${l.lightningTail}
  ${l.ldsRedirectConsole}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsInnerIndexPage = lightningTemplate("lds/page/inner-index")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsInnerIndex' layout in ${import.meta.url} -->
  <head>
    ${l.lightningHead}
    ${(_, layout) => layout.contributions.scripts.contributions()}
    ${(_, layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${l.lightningBodyAttrs}>
  ${l.ldsRedirectConsoleContainer}
  ${l.ldsResourceDiagnostics}
  <header>
  ${ldsContextBar}
  </header>
  
  <main class="container flex slds-m-vertical_small">
  <div class="slds-grid slds-wrap">
    <div class="slds-grid slds-grid_align-center slds-gutters_medium slds-var-m-around_medium">
      <div>
        ${ldsBreadcrumbs}
        ${ldsPageHeading}
        <div id="content" class="slds-m-top_x-large">
        ${l.lightningBody}
        </div>
        ${l.ldsLayoutDiagnostics}
      </div>
    </div>
  </div>
  </main>
  ${ldsFooterFixedCopyrightBuild}
  ${l.lightningTail}
  ${l.ldsRedirectConsole}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsInnerIndexAutoPage = lightningTemplate("lds/page/inner-index-auto")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsInnerIndexAuto' layout in ${import.meta.url} -->
  <head>
    ${l.lightningHead}
    ${(_, layout) => layout.contributions.scripts.contributions()}
    ${(_, layout) => layout.contributions.stylesheets.contributions()}
  </head>
  <body${l.lightningBodyAttrs}>
  ${l.ldsRedirectConsoleContainer}
  ${l.ldsResourceDiagnostics}
  <header>
  ${ldsContextBar}
  </header>
  
  <main class="container flex slds-m-vertical_small">
  <div class="slds-grid slds-wrap">
    <div class="slds-grid slds-grid_align-center slds-gutters_medium slds-var-m-around_medium">
      <div>
        ${ldsBreadcrumbsWithoutTerminal}
        ${ldsPageHeading}
        <div id="content" class="slds-m-top_x-large">
        ${(body, layout) => layout.model.isContentAvailable ? l.lightningBody(body, layout) : ''}
        ${ldsAutoIndexCardsBody}
        </div>
        ${l.ldsLayoutDiagnostics}
      </div>
    </div>
  </div>
  </main>
  ${ldsFooterFixedCopyrightBuild}
  ${l.lightningTail}
  ${l.ldsRedirectConsole}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsNoDefinitiveLayoutPage = lightningTemplate("lds/page/no-layout")`<!DOCTYPE html>
<html lang="en"> <!-- 'ldsNoDefinitiveLayoutPage' layout in ${import.meta.url} -->
  <head>
    ${l.lightningHead}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
    <title>SLDS Diagnostics</title>
  </head>
  <body${l.lightningBodyAttrs}>
    ${l.ldsRedirectConsoleContainer}
    <h1>SLDS Diagnostics</h2>
    You did not choose a proper layout either programmtically or through frontmatter.
    ${l.ldsResourceDiagnostics}
    <h2>Layout Strategy</h2>
    <pre><code class="language-js">${(_, layout) => c.escapeHTML(Deno.inspect(layout.layoutSS, { depth: undefined }).trimStart())}</code></pre>
    ${ldsFooterFixedCopyrightBuild}
    ${l.lightningTail}
    ${l.ldsRedirectConsole}
  </body>
</html>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const ldsNoDecorationPage = lightningTemplate("lds/page/no-decoration")`${l.lightningBody}`;

export const ldsPrime: html.HtmlLayoutStrategy<ldsGovn.LightningLayout> = {
  ...ldsSmartNavigationPage,
  identity: "lds/page/prime",
};

const autoRegisterLayouts = [
  ldsPrime,
  ldsHomePage,
  ldsInnerIndexPage,
  ldsInnerIndexAutoPage,
  ldsNoDecorationPage,
  ldsNoDefinitiveLayoutPage,
];

export class LightingDesignSystemLayouts<
  Layout extends ldsGovn.LightningLayout,
> extends html.DesignSystemLayouts<Layout> {
  constructor() {
    super({ layoutStrategy: ldsPrime });
    autoRegisterLayouts.forEach((l) => this.layouts.set(l.identity, l));
  }
}

export const isLightningNavigationNotificationSupplier = safety.typeGuard<
  ldsGovn.LightningNavigationNotificationSupplier
>("ldsNavNotification");

export class LightingDesignSystemNavigation
  implements ldsGovn.LightningNavigation {
  constructor(
    readonly prettyURLs: boolean,
    readonly routeTree: rtree.TypicalRouteTree,
    readonly home = "/", // TODO: adjust for base location etc.
  ) {
  }

  contextBarItems(_layout: ldsGovn.LightningLayout): govn.RouteNode[] {
    return this.routeTree.items.length > 0 ? this.routeTree.items : [];
  }

  contentTree(layout: ldsGovn.LightningLayout): govn.RouteTreeNode | undefined {
    return layout.activeTreeNode?.parent;
  }

  location(unit: govn.RouteNode): string {
    if (this.prettyURLs) {
      const loc = unit.qualifiedPath === "/index" ? "/" : unit.location();
      return loc.endsWith("/index")
        ? loc.endsWith("/") ? `${loc}..` : `${loc}/..`
        : (loc.endsWith("/") ? loc : `${loc}/`);
    }
    return unit.qualifiedPath === "/index" ? "/" : unit.location();
  }

  redirectUrl(
    rs: govn.RedirectSupplier,
  ): govn.RouteLocation | undefined {
    return route.isRedirectUrlSupplier(rs)
      ? rs.redirect
      : this.location(rs.redirect);
  }

  notification(
    node: govn.RouteTreeNode,
  ): ldsGovn.LightningNavigationNotification | undefined {
    if (isLightningNavigationNotificationSupplier(node.route)) {
      return node.route.ldsNavNotification;
    }
  }

  clientCargoValue(_layout: html.HtmlLayout) {
    let locationJsFn = "";
    if (this.prettyURLs) {
      locationJsFn = `{
          const loc = unit.qualifiedPath === "/index" ? "/" : unit.location();
          return loc.endsWith("/index")
            ? loc.endsWith("/") ? \`\${loc}..\` : \`\${loc}/..\`
            : (loc.endsWith("/") ? loc : \`\${loc}/\`);
        }`;
    } else {
      locationJsFn = `unit.qualifiedPath === "/index" ? "/" : unit.location()`;
    }
    return `{
      location: (unit) => ${locationJsFn}
    }`;
  }
}

export class LightingDesignSystemText implements ldsGovn.LightningLayoutText {
  /**
   * Supply the <title> tag text from a inheritable set of model suppliers.
   * @param layout the active layout where the title will be rendered
   * @returns title text from first model found or from the frontmatter.title or the terminal route unit
   */
  title(layout: ldsGovn.LightningLayout) {
    const fmTitle = layout.frontmatter?.title;
    if (fmTitle) return String(fmTitle);
    const title: () => string = () => {
      if (layout.activeRoute?.terminal) {
        return layout.activeRoute?.terminal.label;
      }
      return "(no frontmatter, terminal route, or model title)";
    };
    const model = m.model<{ readonly title: string }>(
      () => {
        return { title: title() };
      },
      layout.activeTreeNode,
      layout.activeRoute,
      layout.bodySource,
    );
    return model.title || title();
  }
}

const defaultContentModel: () => govn.ContentModel = () => {
  return { isContentModel: true, isContentAvailable: false };
};

export class LightingDesignSystem<Layout extends ldsGovn.LightningLayout>
  extends html.DesignSystem<Layout, ldsGovn.LightningLayoutText> {
  readonly lightningAssetsBaseURL = "/lightning";
  readonly lightningAssetsPathUnits = ["lightning"];
  constructor(
    readonly emptyContentModelLayoutSS:
      & govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier>
      & govn.ModelLayoutStrategySupplier<Layout, govn.HtmlSupplier> = {
        layoutStrategy: ldsInnerIndexAutoPage,
        isInferredLayoutStrategySupplier: true,
        isModelLayoutStrategy: true,
        modelLayoutStrategyDiagnostic: "no content available",
      },
  ) {
    super("LightningDS", new LightingDesignSystemLayouts());
  }

  /**
   * All images, stylesheets, scripts, and other "assets" will be symlink'd
   * so that they can be available in the published artifacts but can easily
   * be modified during development using any local web server without any
   * special "development server".
   * @param destRootPath where to place the assets on the file system
   */
  async symlinkAssets(destRootPath: string) {
    const dsPath = path.dirname(import.meta.url).substr("file://".length);
    for (const entry of ["images", "styles", "scripts"]) {
      await fs.ensureSymlink(
        path.join(dsPath, entry),
        path.join(destRootPath, ...this.lightningAssetsPathUnits, entry),
      );
    }
  }

  assets(
    base = "", // should NOT be terminated by / since assets will be prefixed by /
    inherit?: Partial<ldsGovn.AssetLocations>,
  ): ldsGovn.AssetLocations {
    return {
      ldsIcons: (relURL) =>
        `${this.lightningAssetsBaseURL}/images/slds-icons${relURL}`,
      dsImage: (relURL) => `${this.lightningAssetsBaseURL}/images${relURL}`,
      dsScript: (relURL) => `${this.lightningAssetsBaseURL}/scripts${relURL}`,
      dsStylesheet: (relURL) =>
        `${this.lightningAssetsBaseURL}/styles${relURL}`,
      image: (relURL) => `${base}${relURL}`,
      favIcon: (relURL) => `${base}/favicons${relURL}`,
      script: (relURL) => `${base}${relURL}`,
      stylesheet: (relURL) => `${base}${relURL}`,
      brandImage: (relURL) => `${base}/brand${relURL}`,
      brandFavIcon: (relURL) => `${base}/brand/favicons${relURL}`,
      brandScript: (relURL) => `${base}/brand${relURL}`,
      brandStylesheet: (relURL) => `${base}/brand${relURL}`,
      clientCargoValue: () => {
        return `{
          assetsBaseAbsURL() { return "${base}" },
          ldsIcons(relURL) { return \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/images/slds-icons\${relURL}\`; },
          dsImage(relURL) { return \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/images\${relURL}\`; },
          dsScript(relURL) { return  \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/scripts\${relURL}\`; },
          dsStylesheet(relURL) { return \`\${this.assetsBaseAbsURL()}${this.lightningAssetsBaseURL}/styles\${relURL}\`; },
          image(relURL) { return \`\${this.assetsBaseAbsURL()}\${relURL}\`; },
          favIcon(relURL) { return \`\${this.assetsBaseAbsURL()}/favicon/\${relURL}\`; },
          script(relURL) { return \`\${this.assetsBaseAbsURL()}\${relURL}\`; },
          stylesheet(relURL) { return \`\${this.assetsBaseAbsURL()}\${relURL}\`; },
          brandImage(relURL) { return this.image(\`/brand/\${relURL}\`); },
          brandScript(relURL) { return this.script(\`/brand/\${relURL}\`); },
          brandStylesheet(relURL) { return this.stylesheet(\`/brand/\${relURL}\`); },
          brandFavIcon(relURL) { return this.favIcon(\`/brand/\${relURL}\`); },
        }`;
      },
      ...inherit,
    };
  }

  inferredLayoutStrategy(
    s: Partial<
      | govn.FrontmatterSupplier<govn.UntypedFrontmatter>
      | govn.ModelSupplier<govn.UntypedModel>
    >,
  ): govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
    if (c.isContentModelSupplier(s) && !s.model.isContentAvailable) {
      return this.emptyContentModelLayoutSS;
    }
    return super.inferredLayoutStrategy(s);
  }

  layout(
    body: html.HtmlLayoutBody | (() => html.HtmlLayoutBody),
    layoutText: ldsGovn.LightningLayoutText,
    layoutSS: html.HtmlLayoutStrategySupplier<Layout>,
    navigation: ldsGovn.LightningNavigation,
    assets: ldsGovn.AssetLocations,
    branding: ldsGovn.LightningBranding,
  ): Layout {
    const bodySource = typeof body === "function" ? body() : body;
    const frontmatter = fm.isFrontmatterSupplier(bodySource)
      ? bodySource.frontmatter
      : undefined;
    const layoutArgs = this.frontmatterLayoutArgs(frontmatter);
    const activeRoute = route.isRouteSupplier(bodySource)
      ? bodySource.route
      : undefined;
    const activeTreeNode = activeRoute?.terminal
      ? navigation.routeTree.node(activeRoute?.terminal.qualifiedPath)
      : undefined;
    const model = c.contentModel(
      defaultContentModel,
      activeTreeNode,
      activeRoute,
      bodySource,
    );
    const result: ldsGovn.LightningLayout = {
      bodySource,
      model,
      layoutText,
      layoutSS,
      navigation,
      assets,
      branding,
      frontmatter,
      activeRoute,
      activeTreeNode,
      contributions: this.contributions(),
      clientCargoPropertyName: "clientLayout",
      ...layoutArgs,
    };
    return result as Layout; // TODO: consider not casting to type
  }

  pageRenderer(
    layoutText: ldsGovn.LightningLayoutText,
    navigation: ldsGovn.LightningNavigation,
    assets: ldsGovn.AssetLocations,
    branding: ldsGovn.LightningBranding,
    refine?: govn.ResourceRefinery<html.HtmlLayoutBody>,
  ): govn.ResourceRefinery<govn.HtmlSupplier> {
    return async (resource) => {
      const lss =
        fm.isFrontmatterSupplier(resource) || m.isModelSupplier(resource)
          ? this.inferredLayoutStrategy(resource)
          : this.layoutStrategies.diagnosticLayoutStrategy(
            "Neither frontmatter nor model supplied to LightingDesignSystem.pageRenderer",
          );
      return await lss.layoutStrategy.rendered(this.layout(
        refine ? await refine(resource) : resource,
        layoutText,
        lss,
        navigation,
        assets,
        branding,
      ));
    };
  }

  pageRendererSync(
    layoutText: ldsGovn.LightningLayoutText,
    navigation: ldsGovn.LightningNavigation,
    assets: ldsGovn.AssetLocations,
    branding: ldsGovn.LightningBranding,
    refine?: govn.ResourceRefinerySync<html.HtmlLayoutBody>,
  ): govn.ResourceRefinerySync<govn.HtmlSupplier> {
    return (resource) => {
      const lss =
        fm.isFrontmatterSupplier(resource) || m.isModelSupplier(resource)
          ? this.inferredLayoutStrategy(resource)
          : this.layoutStrategies.diagnosticLayoutStrategy(
            "Neither frontmatter nor model supplied to LightingDesignSystem.pageRendererSync",
          );
      return lss.layoutStrategy.renderedSync(this.layout(
        refine ? refine(resource) : resource,
        layoutText,
        lss,
        navigation,
        assets,
        branding,
      ));
    };
  }

  prettyUrlsHtmlProducer(
    destRootPath: string,
    layoutText: ldsGovn.LightningLayoutText,
    navigation: ldsGovn.LightningNavigation,
    assets: ldsGovn.AssetLocations,
    branding: ldsGovn.LightningBranding,
  ): govn.ResourceRefinery<govn.HtmlSupplier> {
    const producer = r.pipelineUnitsRefineryUntyped(
      this.pageRenderer(layoutText, navigation, assets, branding),
      nature.htmlContentNature.persistFileSysRefinery(
        destRootPath,
        persist.routePersistPrettyUrlHtmlNamingStrategy((ru) =>
          ru.unit === "index"
        ),
      ),
    );

    return async (resource) => {
      if (
        render.isRenderableMediaTypeResource(
          resource,
          nature.htmlMediaTypeNature.mediaType,
        )
      ) {
        return await producer(resource);
      }
      // we cannot handle this type of rendering target, no change to resource
      return resource;
    };
  }
}
