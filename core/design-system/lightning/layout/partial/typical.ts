import * as ldsGovn from "../../governance.ts";
import * as dia from "./diagrams.ts";

export const typicalBodyPartial: ldsGovn.LightningPartial = (body) =>
  body || "<!-- no lightningBody -->";

// hide properties that could have circular references which will break JSON.stringify()
const routeJsonReplacer = (key: string, value: unknown) =>
  ["ldsNavNotification", "owner", "parent", "children", "ancestors"].find((
      name,
    ) => name == key
    )
    ? "(ignored)"
    : value;

export const clientCargoPartial: ldsGovn.LightningPartial = (_, layout) => {
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return `<script>
    "use strict";
    const ${layout.clientCargoPropertyName} = {
      route: ${layout.activeRoute ? JSON.stringify(layout.activeRoute, routeJsonReplacer) : `undefined`},
      frontmatter: ${layout.frontmatter ? JSON.stringify(layout.frontmatter) : `undefined`},
      urlRelToSelf(relURL) { return ((location.pathname.endsWith('/') ? location.pathname : \`\${location.pathname}/\`) + (relURL || '')).replace(/\\/\\/+/g, "/")}, // account for pretty URL
      selfURL(relURL) { return relURL.startsWith('./') ? this.urlRelToSelf(relURL.substring(1)) : (relURL.startsWith('../') ? this.urlRelToSelf(relURL) : relURL)},
      assets: ${layout.assets.clientCargoValue(layout)},
      navigation: ${layout.navigation.clientCargoValue(layout)},
      diagnostics: ${layout.diagnostics ? "true" : "false"},
      activate: undefined, // set to (cargo) => { ... } to call in lightningActivatePage() before any other activation done
      finalize: undefined, // set to (cargo, ...) => { ... } to call in lightningActivatePage() after all other activation done
      location(relURL) { return \`\${this.route?.terminal?.qualifiedPath}\${relURL}\` },
      navigate(absURL) { window.location = absURL; },
      lightingIconURL(identity, layout) {
        const collection = typeof identity === "string" ? "utility" : identity.collection;
        const name = typeof identity === "string" ? identity : identity.name;
        return this.assets.ldsIcons(
          \`/\${collection}-sprite/svg/symbols.svg#\${name}\`,
        );
      }      
    };
    </script>`;
};

export const bodyAttrsPartial: ldsGovn.LightningPartial = (_, layout) =>
  ` onload="if (typeof lightningActivatePage == 'function') { lightningActivatePage(${layout.clientCargoPropertyName}, lightningActivateAllPageItems); } else { console.warn('lightningActivatePage(cargo) not available'); }"`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const typicalHeadPartial: ldsGovn.LightningPartial = (_, layout) => `
<meta charset="utf-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
<link href="https://cdnjs.cloudflare.com" crossorigin>
<link rel="stylesheet preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/design-system/2.14.2/styles/salesforce-lightning-design-system.min.css" integrity="sha512-v9eTZELqSZcRlIRltjIbpM55zkTQ9azkDAjI0IByyjHLWty1U2+CSPtnNxGpC3FFkpsKwAOfciCv4PWhW/pQGw==" crossorigin="anonymous" />
<link rel="stylesheet" href="${layout.assets.dsStylesheet("/lightning-customize.css")}">
<!-- [script.js](https://github.com/ded/script.js) is a JavaScript loader
     and dependency manager. You should use this instead of <script> tags.
     TODO: consider https://addyosmani.com/basket.js/ as well -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/script.js/2.5.9/script.min.js"></script>
${dia.mermaidDiagramsPartial(_, layout)}
${clientCargoPartial(_, layout)} 
<link rel="shortcut icon" href="${layout.assets.favIcon("/favicon.ico")}"/>
<title>${layout.layoutText.title(layout)}</title>
`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const typicalTailPartial: ldsGovn.LightningPartial = (_, layout) => `
<script src="${layout.assets.dsScript("/content.js")}"></script>
<script src="${layout.assets.dsScript("/lightning.js")}"></script>`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const redirectConsoleContainerPartial: ldsGovn.LightningPartial = (_, layout) => layout.redirectConsoleToHTML ? `
<ul id="container_ldsRedirectConsole"></ul>` : `<!-- layout.redirectConsoleToHTML is false -->`;

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const redirectConsolePartial: ldsGovn.LightningPartial = (_, layout) => layout.redirectConsoleToHTML ? `
<script>lightningRedirectConsole()</script>` : `<!-- layout.redirectConsoleToHTML is false -->`;
