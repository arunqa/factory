class ApacheEChartsComponent extends HTMLElement {
    static configHrefAttrName = "config-href";
    static get observedAttributes() {
        return [ApacheEChartsComponent.configHrefAttrName]
    }

    constructor() {
        // Always call super() first, this is required by the spec.
        super();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.__initialized) { return }
        if (oldValue !== newValue) {
            this[name] = newValue
        }
    }

    get configHref() {
        return this.getAttribute(ApacheEChartsComponent.configHrefAttrName);
    }

    set configHref(val) {
        if (val) {
            this.setAttribute(ApacheEChartsComponent.configHrefAttrName, val);
        } else {
            this.removeAttribute(ApacheEChartsComponent.configHrefAttrName);
        }
    }

    navigate(data, _options) {
        if (("navigation" in data) && data.navigation) {
            window.location = data.navigation.url;
        }
        if (("url" in data) && data.url) {
            window.location = data.url;
        }
    }

    connectedCallback() {
        if (this.configHref) {
            $script(
                "https://cdn.jsdelivr.net/npm/echarts@5.1.2/dist/echarts.min.js",
                () => {
                    const configure = (chartDefn) => {
                        const chart = echarts.init(this);
                        chart.setOption(chartDefn);
                        chart.on("click", (params) => {
                            this.navigate(params.data);
                        });
                        // deno-lint-ignore no-window-prefix
                        window.addEventListener("resize", () => {
                            chart.resize();
                        });
                    };

                    const configURL = this.configHref;
                    if (configURL) {
                        fetch(configURL).then(
                            (response) => {
                                if (response.status == 200) {
                                    response.json().then((config) => {
                                        configure(config);
                                    });
                                } else {
                                    this.innerHTML = `Error loading ${configURL}: response.status = ${response.status}`;
                                }
                            },
                        ).catch((error) => {
                            this.innerHTML = `Error loading ${configURL}: ${error}`;
                        });
                    } else {
                        this.innerHTML = `this.configHref (attribute "${AgGridComponent.configHrefAttrName}") not supplied`
                    }
                },
            );
        } else {
            this.innerHTML = `this.configHref (attribute "${ApacheEChartsComponent.configHrefAttrName}") not supplied`
        }
    }
}

customElements.define('apache-echarts', ApacheEChartsComponent);
