import * as govn from "../../../../../governance/mod.ts";
import * as dGovn from "./governance.ts";
import * as nature from "../../../../std/nature.ts";
import * as route from "../../../../std/route.ts";
import * as rJSON from "../../../../content/routes.json.ts";
import * as lds from "../../mod.ts";

function routesHTML(
  _state: dGovn.DiagnosticsResourcesState,
): lds.LightningLayoutBodySupplier {
  // deno-fmt-ignore
  return (_layout) => `
  <template id="resource-node-leaf-row">
    <tr aria-level="{level}" aria-posinset="1" aria-selected="false" aria-setsize="4" class="slds-hint-parent"  tabindex="0">
        <th class="slds-tree__item" data-label="{resource}" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand {resourceInstance}">
                <svg class="slds-button__icon slds-button__icon_small" aria-hidden="true">
                    <use href="/assets/icons/utility-sprite/svg/symbols.svg#chevronright"></use>
                </svg>
                <span class="slds-assistive-text">Expand {resourceInstance}</span>
            </button>
            <div class="slds-truncate" title="{resourceInstance}">
                <a href="#" tabindex="-1">{resourceInstance}</a>
            </div>
        </th>
        <td data-label="Nature" role="gridcell" width="20%">
            <div class="slds-truncate" title="{resourceNatureTitle}">{resourceNature}</div>
        </td>
    </tr>
  </template>
  
  <template id="resource-node-row-parent-expanded">
    <tr aria-expanded="true" aria-level="{level}" aria-posinset="2" aria-selected="false" aria-setsize="4" class="slds-hint-parent">
        <th class="slds-tree__item" data-label="{resource}" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse {resourceInstance}">
                <svg class="slds-button__icon slds-button__icon_small" aria-hidden="true">
                    <use href="/assets/icons/utility-sprite/svg/symbols.svg#chevronright"></use>
                </svg>
                <span class="slds-assistive-text">Collapse {resourceInstance}</span>
            </button>
            <div class="slds-truncate" title="{resourceInstance}">
                <a href="{leafResourceInstanceURL}" tabindex="-1">{resourceInstance}</a>
            </div>
        </th>
        <td data-label="Nature" role="gridcell" width="20%">
            <div class="slds-truncate" title="{resourceNatureTitle}">{resourceNature}</div>
        </td>
    </tr>
  </template>
  
  <table aria-multiselectable="true"
    class="slds-table slds-table_bordered slds-table_edit slds-table_fixed-layout slds-table_resizable-cols slds-tree slds-table_tree"
    role="treegrid" aria-label="Example tree grid with deep nesting">
    <thead>
        <tr class="slds-line-height_reset">
            <th aria-label="Resource" aria-sort="none" class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
                <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                    <span class="slds-assistive-text">Sort by: </span>
                    <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                        <span class="slds-truncate" title="Resource">Resource</span>
                        <span class="slds-icon_container slds-icon-utility-arrowdown">
                            <svg class="slds-icon slds-icon-text-default slds-is-sortable__icon " aria-hidden="true">
                                <use href="/assets/icons/utility-sprite/svg/symbols.svg#arrowdown"></use>
                            </svg>
                        </span>
                    </div>
                </a>
                <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                    aria-haspopup="true" tabindex="-1" title="Show Resource column actions">
                    <svg class="slds-button__icon slds-button__icon_hint slds-button__icon_small" aria-hidden="true">
                        <use href="/assets/icons/utility-sprite/svg/symbols.svg#chevrondown"></use>
                    </svg>
                    <span class="slds-assistive-text">Show Resource column actions</span>
                </button>
                <div class="slds-resizable">
                    <input type="range" aria-label="Resource column width"
                        class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-126" max="1000"
                        min="20" tabindex="-1" />
                    <span class="slds-resizable__handle">
                        <span class="slds-resizable__divider"></span>
                    </span>
                </div>
            </th>
            <th aria-label="Nature" aria-sort="none" class="slds-has-button-menu slds-is-resizable slds-is-sortable"
                scope="col" width="20%">
                <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                    <span class="slds-assistive-text">Sort by: </span>
                    <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                        <span class="slds-truncate" title="Nature">Nature</span>
                        <span class="slds-icon_container slds-icon-utility-arrowdown">
                            <svg class="slds-icon slds-icon-text-default slds-is-sortable__icon " aria-hidden="true">
                                <use href="/assets/icons/utility-sprite/svg/symbols.svg#arrowdown"></use>
                            </svg>
                        </span>
                    </div>
                </a>
                <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                    aria-haspopup="true" tabindex="-1" title="Show Nature column actions">
                    <svg class="slds-button__icon slds-button__icon_hint slds-button__icon_small" aria-hidden="true">
                        <use href="/assets/icons/utility-sprite/svg/symbols.svg#chevrondown"></use>
                    </svg>
                    <span class="slds-assistive-text">Show Nature column actions</span>
                </button>
                <div class="slds-resizable">
                    <input type="range" aria-label="Nature column width"
                        class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-127" max="1000"
                        min="20" tabindex="-1" />
                    <span class="slds-resizable__handle">
                        <span class="slds-resizable__divider"></span>
                    </span>
                </div>
            </th>
        </tr>
    </thead>
    <tbody id="resourceTreeTableBody">
        <!-- will be replaced at runtime -->
    </tbody>
  
    <script>
        // Instantiate the table with the existing HTML tbody
        // and the row with the template
        const tbody = document.querySelector("#resourceTreeTableBody");
        const parentTemplate = document.querySelector('#resource-node-row-parent-expanded');
        const leafTemplate = document.querySelector('#resource-node-leaf-row');
  
        const handleNodes = (items) => {
            items.sort((a, b) => (a.label > b.label) ? 1 : -1).forEach(i => {
                const hasChildren = i.children && i.children.length > 0;
                const content = hasChildren 
                  ? parentTemplate.content.cloneNode(true)
                  : leafTemplate.content.cloneNode(true);
                const row = content.querySelector("tr");
                row.setAttribute("aria-level", i.level);
  
                const resource = content.querySelector("tr th div a");
                resource.textContent = i.label;
                resource.setAttribute("href", i.qualifiedPath);
                resource.parentNode.setAttribute("title", i.label);
  
                const cells = content.querySelectorAll("td div");
                cells[0].textContent = i.route?.nature?.mediaType;
                //cells[1].textContent = Array.isArray(i.route?.nature?.renderTargets) 
                //  ? i.route?.nature?.renderTargets.map(t => t.mediaType).join(", ") 
                //  : (i.route?.nature?.renderTargets?.mediaType);
                //cells[2].textContent = i.remarks;
                tbody.appendChild(content);
  
                if(hasChildren) {
                    handleNodes(i.children);
                }
            });
        };
  
        fetch('../routes.json')
          .then(response => response.json())
          .then(data => {
            handleNodes(data.items);
            lightningTreeGridsActivate();
            assignlightningIconSvgUseBase(document.querySelectorAll("svg > use"), clientLayout);
          });
    </script>
  </table>`
}

/**
 * Use routesResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function routesHtmlFactorySupplier(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: dGovn.DiagnosticsResourcesState,
): govn.ResourceFactorySupplier<govn.HtmlResource> {
  return {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const sitemapHTML: govn.PersistableHtmlResource & govn.RouteSupplier = {
        nature: nature.htmlContentNature,
        route: {
          ...rf.childRoute(
            { unit: "routes", label: "Routes", aliases: ["../"] },
            parentRoute,
            false,
          ),
          nature: nature.htmlContentNature,
          origin: route.routeModuleOrigin(
            import.meta.url,
            "routesHtmlFactorySupplier",
          ),
        },
        html: {
          // deno-lint-ignore require-await
          text: async (layout: lds.LightningLayout) =>
            routesHTML(state)(layout),
          textSync: routesHTML(state),
        },
      };
      return sitemapHTML;
    },
  };
}

/**
 * Use routesResources as originators within any parent route.
 * @param parentRoute Where you want the resources generated
 * @returns resources factories to be included as originators
 */
export function routesJsonFactorySupplier(
  parentRoute: govn.Route,
  rf: govn.RouteFactory,
  state: dGovn.DiagnosticsResourcesState,
): govn.ResourceFactorySupplier<govn.JsonInstanceSupplier> {
  return {
    // deno-lint-ignore require-await
    resourceFactory: async () => {
      const sitemapJSON: govn.PersistableJsonResource & govn.RouteSupplier = {
        nature: nature.jsonContentNature,
        route: {
          ...rf.childRoute(
            { unit: "routes", label: "Routes JSON" },
            parentRoute,
            false,
          ),
          nature: nature.jsonContentNature,
          origin: route.routeModuleOrigin(
            import.meta.url,
            "routesJsonFactorySupplier",
          ),
        },
        jsonInstance: () => state.routes.resourcesTree,
        jsonText: {
          // deno-lint-ignore require-await
          text: async () => {
            return JSON.stringify(
              state.routes.resourcesTree,
              rJSON.routeTreeJsonReplacer,
              "  ",
            );
          },
          textSync: () => {
            return JSON.stringify(
              state.routes.resourcesTree,
              rJSON.routeTreeJsonReplacer,
              "  ",
            );
          },
        },
      };
      return sitemapJSON;
    },
  };
}
