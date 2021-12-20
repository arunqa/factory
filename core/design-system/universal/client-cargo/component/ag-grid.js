class AgGridComponent extends HTMLElement {
    static configHrefAttrName = "config-href";
    static domLayoutAttrName = "dom-layout";
    static get observedAttributes() {
        return [AgGridComponent.configHrefAttrName, AgGridComponent.domLayoutAttrName]
    }

    constructor() {
        // Always call super() first, this is required by the spec.
        super();
        this.configHref = this.getAttribute(AgGridComponent.configHrefAttrName);
        this.domLayout = this.getAttribute(AgGridComponent.domLayoutAttrName) || "autoHeight";
    }

    connectedCallback() {
        $script(
            "https://unpkg.com/ag-grid-community/dist/ag-grid-community.min.js",
            () => {
                const configure = (gridDefn) => {
                    const config = {
                        domLayout: this.domLayout,
                        rowSelection: "single",
                        ...gridDefn, // either from innerHTML or API, everything overrides the defaults
                        onGridReady: (event) => event.columnApi.autoSizeAllColumns(),
                        components: {
                            // see https://www.ag-grid.com/javascript-grid/components/
                            // if any cell has this as a renderer, it becomes a "navigation cell"
                            navigationCellRenderer: (params) => {
                                if ("navigation" in params.data) {
                                    return `<a href="${params.data.navigation.url}">${params.value}</a>`;
                                }
                                return params.value;
                            },
                            hideZerosRenderer: (params) => {
                                return typeof params.value === "number"
                                    ? (params.value == 0 ? "" : params.value)
                                    : params.value;
                            },
                        },
                    };
                    new agGrid.Grid(this, config);
                };

                if (this.configHref) {
                    const configURL = this.configHref;
                    fetch(configURL).then(
                        (response) => {
                            if (response.status == 200) {
                                response.json().then((data) => { configure(data); });
                            } else {
                                this.innerHTML = `Error loading <a href="${configURL}">${configURL}</a>: response.status = ${response.status} in AgGridComponent`;
                            }
                        },
                    ).catch((error) => {
                        this.innerHTML = `Error loading ${configURL}: ${error} in AgGridComponent`;
                    });
                } else {
                    this.innerHTML = `this.configHref (attribute "${AgGridComponent.configHrefAttrName}") not supplied for AgGridComponent`
                }
            }
        );
    }
}

customElements.define('ag-grid', AgGridComponent);
