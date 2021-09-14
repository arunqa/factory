import * as govn from "../../governance/mod.ts";
import * as nature from "../../core/std/nature.ts";
import * as route from "../../core/std/route.ts";
import * as htmlModule from "../../core/resource/module/html.ts";
import * as lds from "../../core/design-system/lightning/mod.ts";

// deno-fmt-ignore
const selectedRowHTML: lds.LightningLayoutBodySupplier = (layout) =>
  `<table aria-multiselectable="true"
  class="slds-table slds-table_bordered slds-table_edit slds-table_fixed-layout slds-table_resizable-cols slds-tree slds-table_tree"
  role="treegrid" aria-label="Example tree grid with selected row">
  <thead>
      <tr class="slds-line-height_reset">
          <th class="slds-text-align_right" scope="col" style="width:3.25rem">
              <span id="column-group-header" class="slds-assistive-text">Choose a row</span>
              <div class="slds-th__action slds-th__action_form">
                  <div class="slds-checkbox">
                      <input type="checkbox" name="options" id="checkbox-unique-id-177" value="checkbox-unique-id-177"
                          tabindex="-1" aria-labelledby="check-select-all-label column-group-header" />
                      <label class="slds-checkbox__label" for="checkbox-unique-id-177" id="check-select-all-label">
                          <span class="slds-checkbox_faux"></span>
                          <span class="slds-form-element__label slds-assistive-text">Select All</span>
                      </label>
                  </div>
              </div>
          </th>
          <th aria-label="Account Name" aria-sort="none"
              class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
              <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                  <span class="slds-assistive-text">Sort by: </span>
                  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                      <span class="slds-truncate" title="Account Name">Account Name</span>
                      ${lds.renderedIconContainer(layout, "arrowdown")}
                  </div>
              </a>
              <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="Show Account Name column actions">
                  ${lds.renderedButtonIcon(layout, "chevrondown")}
                  <span class="slds-assistive-text">Show Account Name column actions</span>
              </button>
              <div class="slds-resizable">
                  <input type="range" aria-label="Account Name column width"
                      class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-126" max="1000"
                      min="20" tabindex="-1" />
                  <span class="slds-resizable__handle">
                      <span class="slds-resizable__divider"></span>
                  </span>
              </div>
          </th>
          <th aria-label="Employees" aria-sort="none" class="slds-has-button-menu slds-is-resizable slds-is-sortable"
              scope="col">
              <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                  <span class="slds-assistive-text">Sort by: </span>
                  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                      <span class="slds-truncate" title="Employees">Employees</span>
                      ${lds.renderedIconContainer(layout, "arrowdown")}
                  </div>
              </a>
              <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="Show Employees column actions">
                  ${lds.renderedButtonIcon(layout, "chevrondown")}
                  <span class="slds-assistive-text">Show Employees column actions</span>
              </button>
              <div class="slds-resizable">
                  <input type="range" aria-label="Employees column width"
                      class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-127" max="1000"
                      min="20" tabindex="-1" />
                  <span class="slds-resizable__handle">
                      <span class="slds-resizable__divider"></span>
                  </span>
              </div>
          </th>
          <th aria-label="Phone Number" aria-sort="none"
              class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
              <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                  <span class="slds-assistive-text">Sort by: </span>
                  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                      <span class="slds-truncate" title="Phone Number">Phone Number</span>
                      ${lds.renderedIconContainer(layout, "arrowdown")}
                  </div>
              </a>
              <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="Show Phone Number column actions">
                  ${lds.renderedButtonIcon(layout, "chevrondown")}
                  <span class="slds-assistive-text">Show Phone Number column actions</span>
              </button>
              <div class="slds-resizable">
                  <input type="range" aria-label="Phone Number column width"
                      class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-128" max="1000"
                      min="20" tabindex="-1" />
                  <span class="slds-resizable__handle">
                      <span class="slds-resizable__divider"></span>
                  </span>
              </div>
          </th>
          <th aria-label="Account Owner" aria-sort="none"
              class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
              <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                  <span class="slds-assistive-text">Sort by: </span>
                  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                      <span class="slds-truncate" title="Account Owner">Account Owner</span>
                      ${lds.renderedIconContainer(layout, "arrowdown")}
                  </div>
              </a>
              <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="Show Account Owner column actions">
                  ${lds.renderedButtonIcon(layout, "chevrondown")}
                  <span class="slds-assistive-text">Show Account Owner column actions</span>
              </button>
              <div class="slds-resizable">
                  <input type="range" aria-label="Account Owner column width"
                      class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-129" max="1000"
                      min="20" tabindex="-1" />
                  <span class="slds-resizable__handle">
                      <span class="slds-resizable__divider"></span>
                  </span>
              </div>
          </th>
          <th aria-label="Billing City" aria-sort="none"
              class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
              <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                  <span class="slds-assistive-text">Sort by: </span>
                  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                      <span class="slds-truncate" title="Billing City">Billing City</span>
                      ${lds.renderedIconContainer(layout, "arrowdown")}
                  </div>
              </a>
              <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="Show Billing City column actions">
                  ${lds.renderedButtonIcon(layout, "chevrondown")}
                  <span class="slds-assistive-text">Show Billing City column actions</span>
              </button>
              <div class="slds-resizable">
                  <input type="range" aria-label="Billing City column width"
                      class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-130" max="1000"
                      min="20" tabindex="-1" />
                  <span class="slds-resizable__handle">
                      <span class="slds-resizable__divider"></span>
                  </span>
              </div>
          </th>
          <th class="" scope="col" style="width:3.25rem">
              <div class="slds-truncate slds-assistive-text" title="Actions">Actions</div>
          </th>
      </tr>
  </thead>
  <tbody>
      <tr aria-level="1" aria-posinset="1" aria-selected="false" aria-setsize="4" class="slds-hint-parent"
          tabindex="0">
          <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
              <div class="slds-checkbox">
                  <input type="checkbox" name="options" id="checkbox-0157" value="checkbox-0157"
                      aria-labelledby="check-button-label-0157 column-group-header" />
                  <label class="slds-checkbox__label" for="checkbox-0157" id="check-button-label-0157">
                      <span class="slds-checkbox_faux"></span>
                      <span class="slds-form-element__label slds-assistive-text">Select item 157</span>
                  </label>
              </div>
          </td>
          <th class="slds-tree__item" data-label="Account Name" scope="row">
              <button
                  class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                  aria-hidden="true" tabindex="-1" title="Expand Rewis Inc">
                  ${lds.renderedButtonIcon(layout, "chevronright")}
                  <span class="slds-assistive-text">Expand Rewis Inc</span>
              </button>
              <div class="slds-truncate" title="Rewis Inc">
                  <a href="#" tabindex="-1">Rewis Inc</a>
              </div>
          </th>
          <td data-label="Employees" role="gridcell">
              <div class="slds-truncate" title="3,100">3,100</div>
          </td>
          <td data-label="Phone Number" role="gridcell">
              <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
          </td>
          <td data-label="Account Owner" role="gridcell">
              <div class="slds-truncate" title="Jane Doe">
                  <a href="#" tabindex="-1">Jane Doe</a>
              </div>
          </td>
          <td data-label="Billing City" role="gridcell">
              <div class="slds-truncate" title="Phoenix, AZ">Phoenix, AZ</div>
          </td>
          <td role="gridcell" style="width:3.25rem">
              <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="More actions for Rewis Inc">
                  ${lds.renderedButtonIcon(layout, "down")}
                  <span class="slds-assistive-text">More actions for Rewis Inc</span>
              </button>
          </td>
      </tr>
      <tr aria-expanded="true" aria-level="1" aria-posinset="2" aria-selected="true" aria-setsize="4"
          class="slds-hint-parent slds-is-selected">
          <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
              <div class="slds-checkbox">
                  <input type="checkbox" name="options" id="checkbox-0158" value="checkbox-0158"
                      aria-labelledby="check-button-label-0158 column-group-header" checked="" />
                  <label class="slds-checkbox__label" for="checkbox-0158" id="check-button-label-0158">
                      <span class="slds-checkbox_faux"></span>
                      <span class="slds-form-element__label slds-assistive-text">Select item 158</span>
                  </label>
              </div>
          </td>
          <th class="slds-tree__item" data-label="Account Name" scope="row">
              <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                  aria-hidden="true" tabindex="-1" title="Collapse Acme Corporation">
                  ${lds.renderedButtonIcon(layout, "chevronright")}
                  <span class="slds-assistive-text">Collapse Acme Corporation</span>
              </button>
              <div class="slds-truncate" title="Acme Corporation">
                  <a href="#" tabindex="-1">Acme Corporation</a>
              </div>
          </th>
          <td data-label="Employees" role="gridcell">
              <div class="slds-truncate" title="10,000">10,000</div>
          </td>
          <td data-label="Phone Number" role="gridcell">
              <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
          </td>
          <td data-label="Account Owner" role="gridcell">
              <div class="slds-truncate" title="John Doe">
                  <a href="#" tabindex="-1">John Doe</a>
              </div>
          </td>
          <td data-label="Billing City" role="gridcell">
              <div class="slds-truncate" title="San Francisco, CA">San Francisco, CA</div>
          </td>
          <td role="gridcell" style="width:3.25rem">
              <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation">
                  ${lds.renderedButtonIcon(layout, "down")}
                  <span class="slds-assistive-text">More actions for Acme Corporation</span>
              </button>
          </td>
      </tr>
      <tr aria-level="2" aria-posinset="1" aria-selected="false" aria-setsize="1" class="slds-hint-parent">
          <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
              <div class="slds-checkbox">
                  <input type="checkbox" name="options" id="checkbox-0159" value="checkbox-0159"
                      aria-labelledby="check-button-label-0159 column-group-header" />
                  <label class="slds-checkbox__label" for="checkbox-0159" id="check-button-label-0159">
                      <span class="slds-checkbox_faux"></span>
                      <span class="slds-form-element__label slds-assistive-text">Select item 159</span>
                  </label>
              </div>
          </td>
          <th class="slds-tree__item" data-label="Account Name" scope="row">
              <button
                  class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                  aria-hidden="true" tabindex="-1" title="Expand Acme Corporation (Oakland)">
                  ${lds.renderedButtonIcon(layout, "chevronright")}
                  <span class="slds-assistive-text">Expand Acme Corporation (Oakland)</span>
              </button>
              <div class="slds-truncate" title="Acme Corporation (Oakland)">
                  <a href="#" tabindex="-1">Acme Corporation (Oakland)</a>
              </div>
          </th>
          <td data-label="Employees" role="gridcell">
              <div class="slds-truncate" title="745">745</div>
          </td>
          <td data-label="Phone Number" role="gridcell">
              <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
          </td>
          <td data-label="Account Owner" role="gridcell">
              <div class="slds-truncate" title="John Doe">
                  <a href="#" tabindex="-1">John Doe</a>
              </div>
          </td>
          <td data-label="Billing City" role="gridcell">
              <div class="slds-truncate" title="New York, NY">New York, NY</div>
          </td>
          <td role="gridcell" style="width:3.25rem">
              <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (Oakland)">
                  ${lds.renderedButtonIcon(layout, "down")}
                  <span class="slds-assistive-text">More actions for Acme Corporation (Oakland)</span>
              </button>
          </td>
      </tr>
      <tr aria-expanded="false" aria-level="1" aria-posinset="3" aria-selected="false" aria-setsize="4"
          class="slds-hint-parent">
          <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
              <div class="slds-checkbox">
                  <input type="checkbox" name="options" id="checkbox-0160" value="checkbox-0160"
                      aria-labelledby="check-button-label-0160 column-group-header" />
                  <label class="slds-checkbox__label" for="checkbox-0160" id="check-button-label-0160">
                      <span class="slds-checkbox_faux"></span>
                      <span class="slds-form-element__label slds-assistive-text">Select item 160</span>
                  </label>
              </div>
          </td>
          <th class="slds-tree__item" data-label="Account Name" scope="row">
              <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                  aria-hidden="true" tabindex="-1" title="Expand Rohde Enterprises">
                  ${lds.renderedButtonIcon(layout, "chevronright")}
                  <span class="slds-assistive-text">Expand Rohde Enterprises</span>
              </button>
              <div class="slds-truncate" title="Rohde Enterprises">
                  <a href="#" tabindex="-1">Rohde Enterprises</a>
              </div>
          </th>
          <td data-label="Employees" role="gridcell">
              <div class="slds-truncate" title="6,000">6,000</div>
          </td>
          <td data-label="Phone Number" role="gridcell">
              <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
          </td>
          <td data-label="Account Owner" role="gridcell">
              <div class="slds-truncate" title="John Doe">
                  <a href="#" tabindex="-1">John Doe</a>
              </div>
          </td>
          <td data-label="Billing City" role="gridcell">
              <div class="slds-truncate" title="New York, NY">New York, NY</div>
          </td>
          <td role="gridcell" style="width:3.25rem">
              <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="More actions for Rohde Enterprises">
                  ${lds.renderedButtonIcon(layout, "down")}
                  <span class="slds-assistive-text">More actions for Rohde Enterprises</span>
              </button>
          </td>
      </tr>
      <tr aria-level="1" aria-posinset="4" aria-selected="false" aria-setsize="4" class="slds-hint-parent">
          <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
              <div class="slds-checkbox">
                  <input type="checkbox" name="options" id="checkbox-0161" value="checkbox-0161"
                      aria-labelledby="check-button-label-0161 column-group-header" />
                  <label class="slds-checkbox__label" for="checkbox-0161" id="check-button-label-0161">
                      <span class="slds-checkbox_faux"></span>
                      <span class="slds-form-element__label slds-assistive-text">Select item 161</span>
                  </label>
              </div>
          </td>
          <th class="slds-tree__item" data-label="Account Name" scope="row">
              <button
                  class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                  aria-hidden="true" tabindex="-1" title="Expand Cheese Corp">
                  ${lds.renderedButtonIcon(layout, "chevronright")}
                  <span class="slds-assistive-text">Expand Cheese Corp</span>
              </button>
              <div class="slds-truncate" title="Cheese Corp">
                  <a href="#" tabindex="-1">Cheese Corp</a>
              </div>
          </th>
          <td data-label="Employees" role="gridcell">
              <div class="slds-truncate" title="1,234">1,234</div>
          </td>
          <td data-label="Phone Number" role="gridcell">
              <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
          </td>
          <td data-label="Account Owner" role="gridcell">
              <div class="slds-truncate" title="Jane Doe">
                  <a href="#" tabindex="-1">Jane Doe</a>
              </div>
          </td>
          <td data-label="Billing City" role="gridcell">
              <div class="slds-truncate" title="Paris, France">Paris, France</div>
          </td>
          <td role="gridcell" style="width:3.25rem">
              <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                  aria-haspopup="true" tabindex="-1" title="More actions for Cheese Corp">
                  ${lds.renderedButtonIcon(layout, "down")}
                  <span class="slds-assistive-text">More actions for Cheese Corp</span>
              </button>
          </td>
      </tr>
  </tbody>
</table>`

// deno-fmt-ignore
const deeplyNestedHTML: lds.LightningLayoutBodySupplier = (layout) =>
  `<pre>${Deno.inspect(layout.supplier.layoutStrategy)}</pre><table aria-multiselectable="true"
class="slds-table slds-table_bordered slds-table_edit slds-table_fixed-layout slds-table_resizable-cols slds-tree slds-table_tree"
role="treegrid" aria-label="Example tree grid with deep nesting">
<thead>
    <tr class="slds-line-height_reset">
        <th class="slds-text-align_right" scope="col" style="width:3.25rem">
            <span id="column-group-header" class="slds-assistive-text">Choose a row</span>
            <div class="slds-th__action slds-th__action_form">
                <div class="slds-checkbox">
                    <input type="checkbox" name="options" id="checkbox-unique-id-177" value="checkbox-unique-id-177"
                        tabindex="-1" aria-labelledby="check-select-all-label column-group-header" />
                    <label class="slds-checkbox__label" for="checkbox-unique-id-177" id="check-select-all-label">
                        <span class="slds-checkbox_faux"></span>
                        <span class="slds-form-element__label slds-assistive-text">Select All</span>
                    </label>
                </div>
            </div>
        </th>
        <th aria-label="Account Name" aria-sort="none"
            class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
            <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                <span class="slds-assistive-text">Sort by: </span>
                <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                    <span class="slds-truncate" title="Account Name">Account Name</span>
                    ${lds.renderedIconContainer(layout, "arrowdown")}
                </div>
            </a>
            <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="Show Account Name column actions">
                ${lds.renderedButtonIcon(layout, "chevrondown")}
                <span class="slds-assistive-text">Show Account Name column actions</span>
            </button>
            <div class="slds-resizable">
                <input type="range" aria-label="Account Name column width"
                    class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-126" max="1000"
                    min="20" tabindex="-1" />
                <span class="slds-resizable__handle">
                    <span class="slds-resizable__divider"></span>
                </span>
            </div>
        </th>
        <th aria-label="Employees" aria-sort="none" class="slds-has-button-menu slds-is-resizable slds-is-sortable"
            scope="col">
            <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                <span class="slds-assistive-text">Sort by: </span>
                <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                    <span class="slds-truncate" title="Employees">Employees</span>
                    ${lds.renderedIconContainer(layout, "arrowdown")}
                </div>
            </a>
            <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="Show Employees column actions">
                ${lds.renderedButtonIcon(layout, "chevrondown")}
                <span class="slds-assistive-text">Show Employees column actions</span>
            </button>
            <div class="slds-resizable">
                <input type="range" aria-label="Employees column width"
                    class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-127" max="1000"
                    min="20" tabindex="-1" />
                <span class="slds-resizable__handle">
                    <span class="slds-resizable__divider"></span>
                </span>
            </div>
        </th>
        <th aria-label="Phone Number" aria-sort="none"
            class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
            <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                <span class="slds-assistive-text">Sort by: </span>
                <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                    <span class="slds-truncate" title="Phone Number">Phone Number</span>
                    ${lds.renderedIconContainer(layout, "arrowdown")}
                </div>
            </a>
            <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="Show Phone Number column actions">
                ${lds.renderedButtonIcon(layout, "chevrondown")}
                <span class="slds-assistive-text">Show Phone Number column actions</span>
            </button>
            <div class="slds-resizable">
                <input type="range" aria-label="Phone Number column width"
                    class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-128" max="1000"
                    min="20" tabindex="-1" />
                <span class="slds-resizable__handle">
                    <span class="slds-resizable__divider"></span>
                </span>
            </div>
        </th>
        <th aria-label="Account Owner" aria-sort="none"
            class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
            <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                <span class="slds-assistive-text">Sort by: </span>
                <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                    <span class="slds-truncate" title="Account Owner">Account Owner</span>
                    ${lds.renderedIconContainer(layout, "arrowdown")}
                </div>
            </a>
            <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="Show Account Owner column actions">
                ${lds.renderedButtonIcon(layout, "chevrondown")}
                <span class="slds-assistive-text">Show Account Owner column actions</span>
            </button>
            <div class="slds-resizable">
                <input type="range" aria-label="Account Owner column width"
                    class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-129" max="1000"
                    min="20" tabindex="-1" />
                <span class="slds-resizable__handle">
                    <span class="slds-resizable__divider"></span>
                </span>
            </div>
        </th>
        <th aria-label="Billing City" aria-sort="none"
            class="slds-has-button-menu slds-is-resizable slds-is-sortable" scope="col">
            <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="-1">
                <span class="slds-assistive-text">Sort by: </span>
                <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                    <span class="slds-truncate" title="Billing City">Billing City</span>
                    ${lds.renderedIconContainer(layout, "arrowdown")}
                </div>
            </a>
            <button class="slds-button slds-button_icon slds-th__action-button slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="Show Billing City column actions">
                ${lds.renderedButtonIcon(layout, "chevrondown")}
                <span class="slds-assistive-text">Show Billing City column actions</span>
            </button>
            <div class="slds-resizable">
                <input type="range" aria-label="Billing City column width"
                    class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-130" max="1000"
                    min="20" tabindex="-1" />
                <span class="slds-resizable__handle">
                    <span class="slds-resizable__divider"></span>
                </span>
            </div>
        </th>
        <th class="" scope="col" style="width:3.25rem">
            <div class="slds-truncate slds-assistive-text" title="Actions">Actions</div>
        </th>
    </tr>
</thead>
<tbody>
    <tr aria-level="1" aria-posinset="1" aria-selected="false" aria-setsize="4" class="slds-hint-parent"
        tabindex="0">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0157" value="checkbox-0157"
                    aria-labelledby="check-button-label-0157 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0157" id="check-button-label-0157">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 157</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Rewis Inc">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Rewis Inc</span>
            </button>
            <div class="slds-truncate" title="Rewis Inc">
                <a href="#" tabindex="-1">Rewis Inc</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="3,100">3,100</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="Jane Doe">
                <a href="#" tabindex="-1">Jane Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="Phoenix, AZ">Phoenix, AZ</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Rewis Inc">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Rewis Inc</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="1" aria-posinset="2" aria-selected="false" aria-setsize="4"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0158" value="checkbox-0158"
                    aria-labelledby="check-button-label-0158 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0158" id="check-button-label-0158">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 158</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Acme Corporation">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Acme Corporation</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation">
                <a href="#" tabindex="-1">Acme Corporation</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="10,000">10,000</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="San Francisco, CA">San Francisco, CA</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="2" aria-posinset="1" aria-selected="false" aria-setsize="2"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0159" value="checkbox-0159"
                    aria-labelledby="check-button-label-0159 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0159" id="check-button-label-0159">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 159</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Acme Corporation (Bay Area)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Acme Corporation (Bay Area)</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation (Bay Area)">
                <a href="#" tabindex="-1">Acme Corporation (Bay Area)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="3,000">3,000</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (Bay Area)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation (Bay Area)</span>
            </button>
        </td>
    </tr>
    <tr aria-level="3" aria-posinset="1" aria-selected="false" aria-setsize="2" class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0160" value="checkbox-0160"
                    aria-labelledby="check-button-label-0160 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0160" id="check-button-label-0160">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 160</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Acme Corporation (Oakland)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Acme Corporation (Oakland)</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation (Oakland)">
                <a href="#" tabindex="-1">Acme Corporation (Oakland)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="745">745</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (Oakland)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation (Oakland)</span>
            </button>
        </td>
    </tr>
    <tr aria-level="3" aria-posinset="2" aria-selected="false" aria-setsize="2" class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0161" value="checkbox-0161"
                    aria-labelledby="check-button-label-0161 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0161" id="check-button-label-0161">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 161</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Acme Corporation (San Francisco)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Acme Corporation (San Francisco)</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation (San Francisco)">
                <a href="#" tabindex="-1">Acme Corporation (San Francisco)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="578">578</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="Jane Doe">
                <a href="#" tabindex="-1">Jane Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="Los Angeles, CA">Los Angeles, CA</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (San Francisco)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation (San Francisco)</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="2" aria-posinset="2" aria-selected="false" aria-setsize="2"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0162" value="checkbox-0162"
                    aria-labelledby="check-button-label-0162 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0162" id="check-button-label-0162">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 162</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Acme Corporation (East)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Acme Corporation (East)</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation (East)">
                <a href="#" tabindex="-1">Acme Corporation (East)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="430">430</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="San Francisco, CA">San Francisco, CA</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (East)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation (East)</span>
            </button>
        </td>
    </tr>
    <tr aria-level="3" aria-posinset="1" aria-selected="false" aria-setsize="2" class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0163" value="checkbox-0163"
                    aria-labelledby="check-button-label-0163 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0163" id="check-button-label-0163">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 163</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Acme Corporation (NY)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Acme Corporation (NY)</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation (NY)">
                <a href="#" tabindex="-1">Acme Corporation (NY)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="1,210">1,210</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="Jane Doe">
                <a href="#" tabindex="-1">Jane Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (NY)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation (NY)</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="3" aria-posinset="2" aria-selected="false" aria-setsize="2"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0164" value="checkbox-0164"
                    aria-labelledby="check-button-label-0164 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0164" id="check-button-label-0164">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 164</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Acme Corporation (VA)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Acme Corporation (VA)</span>
            </button>
            <div class="slds-truncate" title="Acme Corporation (VA)">
                <a href="#" tabindex="-1">Acme Corporation (VA)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="410">410</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Acme Corporation (VA)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Acme Corporation (VA)</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="4" aria-posinset="1" aria-selected="false" aria-setsize="1"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0165" value="checkbox-0165"
                    aria-labelledby="check-button-label-0165 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0165" id="check-button-label-0165">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 165</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Allied Technologies">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Allied Technologies</span>
            </button>
            <div class="slds-truncate" title="Allied Technologies">
                <a href="#" tabindex="-1">Allied Technologies</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="390">390</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="Jane Doe">
                <a href="#" tabindex="-1">Jane Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="Los Angeles, CA">Los Angeles, CA</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Allied Technologies">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Allied Technologies</span>
            </button>
        </td>
    </tr>
    <tr aria-level="5" aria-posinset="1" aria-selected="false" aria-setsize="1" class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0166" value="checkbox-0166"
                    aria-labelledby="check-button-label-0166 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0166" id="check-button-label-0166">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 166</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Allied Technologies (UV)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Allied Technologies (UV)</span>
            </button>
            <div class="slds-truncate" title="Allied Technologies (UV)">
                <a href="#" tabindex="-1">Allied Technologies (UV)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="270">270</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="San Francisco, CA">San Francisco, CA</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Allied Technologies (UV)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Allied Technologies (UV)</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="1" aria-posinset="3" aria-selected="false" aria-setsize="4"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0167" value="checkbox-0167"
                    aria-labelledby="check-button-label-0167 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0167" id="check-button-label-0167">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 167</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Rohde Enterprises">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Rohde Enterprises</span>
            </button>
            <div class="slds-truncate" title="Rohde Enterprises">
                <a href="#" tabindex="-1">Rohde Enterprises</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="6,000">6,000</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Rohde Enterprises">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Rohde Enterprises</span>
            </button>
        </td>
    </tr>
    <tr aria-level="2" aria-posinset="1" aria-selected="false" aria-setsize="1" class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0168" value="checkbox-0168"
                    aria-labelledby="check-button-label-0168 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0168" id="check-button-label-0168">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 168</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Rohde Enterprises (UCA)">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Rohde Enterprises (UCA)</span>
            </button>
            <div class="slds-truncate" title="Rohde Enterprises (UCA)">
                <a href="#" tabindex="-1">Rohde Enterprises (UCA)</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="2,540">2,540</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Rohde Enterprises (UCA)">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Rohde Enterprises (UCA)</span>
            </button>
        </td>
    </tr>
    <tr aria-expanded="true" aria-level="1" aria-posinset="4" aria-selected="false" aria-setsize="4"
        class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0169" value="checkbox-0169"
                    aria-labelledby="check-button-label-0169 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0169" id="check-button-label-0169">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 169</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small"
                aria-hidden="true" tabindex="-1" title="Collapse Tech Labs">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Collapse Tech Labs</span>
            </button>
            <div class="slds-truncate" title="Tech Labs">
                <a href="#" tabindex="-1">Tech Labs</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="1,856">1,856</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="New York, NY">New York, NY</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Tech Labs">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Tech Labs</span>
            </button>
        </td>
    </tr>
    <tr aria-level="2" aria-posinset="1" aria-selected="false" aria-setsize="1" class="slds-hint-parent">
        <td class="slds-text-align_right" role="gridcell" style="width:3.25rem">
            <div class="slds-checkbox">
                <input type="checkbox" name="options" id="checkbox-0170" value="checkbox-0170"
                    aria-labelledby="check-button-label-0170 column-group-header" />
                <label class="slds-checkbox__label" for="checkbox-0170" id="check-button-label-0170">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label slds-assistive-text">Select item 170</span>
                </label>
            </div>
        </td>
        <th class="slds-tree__item" data-label="Account Name" scope="row">
            <button
                class="slds-button slds-button_icon slds-button_icon-x-small slds-m-right_x-small slds-is-disabled"
                aria-hidden="true" tabindex="-1" title="Expand Opportunity Resources Inc">
                ${lds.renderedButtonIcon(layout, "chevronright")}
                <span class="slds-assistive-text">Expand Opportunity Resources Inc</span>
            </button>
            <div class="slds-truncate" title="Opportunity Resources Inc">
                <a href="#" tabindex="-1">Opportunity Resources Inc</a>
            </div>
        </th>
        <td data-label="Employees" role="gridcell">
            <div class="slds-truncate" title="1,934">1,934</div>
        </td>
        <td data-label="Phone Number" role="gridcell">
            <div class="slds-truncate" title="837-555-1212">837-555-1212</div>
        </td>
        <td data-label="Account Owner" role="gridcell">
            <div class="slds-truncate" title="John Doe">
                <a href="#" tabindex="-1">John Doe</a>
            </div>
        </td>
        <td data-label="Billing City" role="gridcell">
            <div class="slds-truncate" title="Los Angeles, CA">Los Angeles, CA</div>
        </td>
        <td role="gridcell" style="width:3.25rem">
            <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small"
                aria-haspopup="true" tabindex="-1" title="More actions for Opportunity Resources Inc">
                ${lds.renderedButtonIcon(layout, "down")}
                <span class="slds-assistive-text">More actions for Opportunity Resources Inc</span>
            </button>
        </td>
    </tr>
</tbody>
</table>`;

// deno-lint-ignore require-await
const constructor: htmlModule.FileSysResourceHtmlModulesConstructor = async (
  we,
  options,
  imported,
) => {
  return {
    imported,
    isChildResourcesFactoriesSupplier: true,
    yieldParentWithChildren: false,
    resourcesFactories: async function* () {
      for (
        const content of [{
          html: deeplyNestedHTML,
          ru: { unit: "deep", label: "Deep" },
        }, {
          html: selectedRowHTML,
          ru: { unit: "selectedRow", label: "Selected Row" },
        }]
      ) {
        const { html, ru } = content;
        const rfs: govn.ResourceFactorySupplier<govn.HtmlResource> = {
          // deno-lint-ignore require-await
          resourceFactory: async () => {
            const resource: govn.PersistableHtmlResource & govn.RouteSupplier =
              {
                nature: nature.htmlContentNature,
                route: {
                  ...options.fsRouteFactory.childRoute(ru, we.route, true),
                  nature: nature.htmlContentNature,
                },
                html: {
                  // deno-lint-ignore require-await
                  text: async (layout: lds.LightningLayout) => html(layout),
                  textSync: html,
                },
              };
            return resource;
          },
        };
        yield rfs;
      }
    },
  };
};
export default constructor;
