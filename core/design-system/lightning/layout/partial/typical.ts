import * as ldsGovn from "../../governance.ts";
import * as dia from "./diagrams.ts";
import * as ext from "./extensions.ts";

export const typicalBodyPartial: ldsGovn.LightningPartial = (_, body) =>
  body || "<!-- no lightningBody -->";

// hide properties that could have circular references which will break JSON.stringify()
const routeJsonReplacer = (key: string, value: unknown) =>
  ["notifications", "owner", "parent", "children", "ancestors"].find((
      name,
    ) => name == key
    )
    ? "(ignored)"
    : value;

export const clientCargoPartial: ldsGovn.LightningPartial = (layout) => {
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return `<script>
    "use strict";
    const ${layout.clientCargoPropertyName} = {
      route: ${layout.activeRoute ? JSON.stringify(layout.activeRoute, routeJsonReplacer) : `undefined`},
      frontmatter: ${layout.frontmatter ? JSON.stringify(layout.frontmatter) : `undefined`},
      urlRelToSelf(relURL) { return ((location.pathname.endsWith('/') ? location.pathname : \`\${location.pathname}/\`) + (relURL || '')).replace(/\\/\\/+/g, "/")}, // account for pretty URL
      selfURL(relURL) { return relURL.startsWith('./') ? this.urlRelToSelf(relURL.substring(1)) : (relURL.startsWith('../') ? this.urlRelToSelf(relURL) : relURL)},
      assets: ${layout.contentStrategy.assets.clientCargoValue(layout)},
      navigation: ${layout.contentStrategy.navigation.clientCargoValue(layout)},
      diagnostics: ${layout.diagnostics ? "true" : "false"},
      activate: undefined, // set to (cargo) => { ... } to call in lightningActivatePage() before any other activation done
      finalize: undefined, // set to (cargo, ...) => { ... } to call in lightningActivatePage() after all other activation done
      location(relURL) { return \`\${this.route?.terminal?.qualifiedPath}\${relURL}\` },
      navigate(absURL) { window.location = absURL; },
      resolvePrettyUrlHref: (path) => {
          if (window.location.pathname.endsWith('/')) return path; // we're a pretty URL, no change
          if (path.startsWith('/')) return path;                   // absolute path, no change
          if (path.startsWith('../')) return path.substr(3);       // relative path but we're not using pretty URL so strip first unit
          return path;                                             // not sure, leave it alone
      },
      lightingIconURL(identity, layout) {
        const collection = typeof identity === "string" ? "utility" : identity.collection;
        const name = typeof identity === "string" ? identity : identity.name;
        return this.assets.ldsIcons(
          \`/\${collection}-sprite/svg/symbols.svg#\${name}\`,
        );
      }
    };

    // useful if layout information is required from other windows
    window.${layout.windowTerminalRoutePropertyName} = ${layout.clientCargoPropertyName}.route.terminal;
    window.${layout.windowClientCargoPropertyName} = ${layout.clientCargoPropertyName};

    // if we're running in a special "workspace" (IDE-like, e.g. VS Code) operational context let's provision ourself
    if(window.${layout.windowOperationalCtxPropertyName} && window.${layout.windowOperationalCtxPropertyName}.workspace) {
      window.${layout.windowOperationalCtxPropertyName}.workspace.provision(${layout.clientCargoPropertyName});
    }
    </script>`;
};

export const bodyAttrsPartial: ldsGovn.LightningPartial = (layout) =>
  ` onload="if (typeof lightningActivatePage == 'function') { lightningActivatePage(${layout.clientCargoPropertyName}, lightningActivateAllPageItems); } else { console.warn('lightningActivatePage(cargo) not available'); }"`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const typicalHeadPartial: ldsGovn.LightningPartial = (layout) => `
${layout.contributions.head.contributions("fore").contributions.join("\n")}
<meta charset="utf-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
<link href="https://cdnjs.cloudflare.com" crossorigin>
<link rel="stylesheet preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/design-system/2.14.2/styles/salesforce-lightning-design-system.min.css" integrity="sha512-v9eTZELqSZcRlIRltjIbpM55zkTQ9azkDAjI0IByyjHLWty1U2+CSPtnNxGpC3FFkpsKwAOfciCv4PWhW/pQGw==" crossorigin="anonymous" />
<link rel="stylesheet" href="${layout.contentStrategy.assets.dsStylesheet("/lightning-customize.css")}">
<link rel="stylesheet" href="${layout.contentStrategy.assets.uStylesheet("/markdown.auto.css")}">
<!-- [script.js](https://github.com/ded/script.js) is a JavaScript loader
     and dependency manager. You should use this instead of <script> tags.
     TODO: consider https://addyosmani.com/basket.js/ as well -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/script.js/2.5.9/script.min.js"></script>
<script src="${layout.contentStrategy.assets.operationalCtx("/server.js")}"></script>
<script src="${layout.contentStrategy.assets.uScript("/universal.js")}"></script>
<script src="${layout.contentStrategy.assets.uScript("/typical.js")}"></script> <!-- TODO: merge typical.js with universal.js? -->
<script src="${layout.contentStrategy.assets.dsScript("/lightning.js")}"></script>
${dia.clientDiagramsContributionsPartial(layout)}
${ext.clientExtensionsContributionsPartial(layout)}
${clientCargoPartial(layout)}
<link rel="shortcut icon" href="${layout.contentStrategy.assets.favIcon("/asset/image/favicon.ico")}"/>
<title>${layout.layoutText.title(layout)}</title>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MX2G8XW');</script>
<!-- End Google Tag Manager -->`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const typicalTailPartial: ldsGovn.LightningPartial = (layout) => `
<script src="${layout.contentStrategy.assets.uScript("/typical-aft.js")}"></script>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const redirectConsoleContainerPartial: ldsGovn.LightningPartial = (layout) => layout.redirectConsoleToHTML ? `
<ul id="container_redirectConsole"></ul>` : `<!-- layout.redirectConsoleToHTML is false -->
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MX2G8XW"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const redirectConsolePartial: ldsGovn.LightningPartial = (layout) => layout.redirectConsoleToHTML ? `
<script>redirectConsoleToHTML()</script>` : `<!-- layout.redirectConsoleToHTML is false -->`;
