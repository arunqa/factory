// Dashboard and Widgets automation library
// ----------------------------------------
// In any HTML page define the following:
// <canvas id="chart1"         // give any ID
//         data-chartjs-target // this is what signifies the canvas is a Chart.js container
//         data-chartjs-config-url="./api/chart.js/assignments.json" // if config is being done via JSON URL
//         >
// </canvas>
// <div id="chart2"         // give any ID
//         data-echarts-target // this is what signifies the canvas is an ECharts container
//         data-echarts-config-url="./api/chart.js/assignments.json" // if config is being done via JSON URL
//         >
//      if the <div> is not empty and no data-echarts-config-url is supplied, then config can be embedded (use style="display:none" to hide from UI while loading)
//      { ...echartsConfig... }
// </div>

class Target {
  constructor(targetID, options) {
    this.targetID = targetID;
    this.options = options;
  }

  element() {
    return document.getElementById(this.targetID);
  }
}

class Content {
  constructor(target, options) {
    this.target = target;
    this.options = options;
    this.telemetry = [];
  }

  reportState(options) {
    const prefix = options?.verbosePrefix ||
      ((self, options) =>
        options?.parent
          ? `[${options.parent.nature} '${options.parent.name}' content '${self.target.targetID}']`
          : `content '${self.target.targetID}'`);
    console.log(
      prefix(this, options),
      this,
      "dataset",
      this.target.element().dataset,
      this.telemetry,
    );
  }

  telemetrySpan(name, _options) {
    const span = {
      name,
      startedOn: new Date(),
      endedOn: undefined,
      complete: (options) => {
        span.endedOn = new Date();
        if (options?.verbose) {
          const prefix = options?.verbosePrefix ||
            ((self, options) =>
              options?.parent
                ? `[${options.parent.nature} '${options.parent.name}' content '${self.target.targetID} ${name}']`
                : `content '${self.target.targetID}' ${name}`);
          console.log(prefix(this, options), span);
        }
      },
    };
    this.telemetry.push(span);
    return span;
  }

  populate(_options) {
    console.error("Content.populate() is an abstract function");
  }

  navigate(data, _options) {
    if (("navigation" in data) && data.navigation) {
      window.location = data.navigation.url;
    }
    if (("url" in data) && data.url) {
      window.location = data.url;
    }
  }
}

class ChartJsContent extends Content {
  static isChartJsContent(targetID, options) {
    const target = new Target(targetID);
    if (target && ("chartjsTarget" in target.element().dataset)) {
      return new ChartJsContent(target, options);
    }
    return undefined;
  }

  populate(options) {
    // deno-lint-ignore no-this-alias
    const self = this;
    $script("https://cdn.jsdelivr.net/npm/chart.js", function () {
      const canvas = self.target.element();
      const configURL = options?.transformURL
        ? options.transformURL(canvas.dataset.chartjsConfigUrl)
        : canvas.dataset.chartjsConfigUrl;
      const telemetry = self.telemetrySpan("populate Chart.js (${configURL})");
      fetch(configURL).then(
        function (response) {
          if (response.status == 200) {
            response.json().then(function (config) {
              const chart = new Chart(canvas, config);
              canvas.onclick = function (evt) {
                const points = chart.getElementsAtEventForMode(evt, "nearest", {
                  intersect: true,
                }, true);
                if (points.length) {
                  const firstPoint = points[0];
                  const data = chart.data.datasets[firstPoint.datasetIndex]
                    .data[firstPoint.index];
                  self.navigate(data);
                }
              };
              telemetry.complete(options);
            });
          } else {
            console.error(
              'Error loading canvas.dataset.chartjsConfigUrl "' + configURL +
                '": response.status = ',
              response.status,
            );
          }
        },
      ).catch((error) => {
        console.error(
          'Error loading canvas.dataset.chartjsConfigUrl "' + configURL + '": ',
          error,
        );
      });
    });
  }
}

class EChartsContent extends Content {
  static isEChartsContent(targetID, options) {
    const target = new Target(targetID);
    if (target && ("echartsTarget" in target.element().dataset)) {
      return new EChartsContent(target, options);
    }
    return undefined;
  }

  populate(options) {
    // deno-lint-ignore no-this-alias
    const self = this;
    $script(
      "https://cdn.jsdelivr.net/npm/echarts@5.1.2/dist/echarts.min.js",
      function () {
        const target = self.target.element();
        const configure = (chartDefn, telemetry) => {
          const chart = echarts.init(target);
          chart.setOption(chartDefn);
          chart.on("click", function (params) {
            self.navigate(params.data);
          });
          window.addEventListener("resize", function () {
            chart.resize();
          });
          telemetry.complete(options);
        };

        if (target.dataset.echartsConfigUrl) {
          const configURL = options?.transformURL
            ? options.transformURL(target.dataset.echartsConfigUrl)
            : target.dataset.echartsConfigUrl;
          const telemetry = self.telemetrySpan(
            `populate ECharts (${configURL})`,
          );
          fetch(configURL).then(
            function (response) {
              if (response.status == 200) {
                response.json().then(function (config) {
                  configure(config, telemetry);
                });
              } else {
                console.error(
                  'Error loading canvas.dataset.echartsConfigUrl "' +
                    configURL + '": response.status = ',
                  response.status,
                );
              }
            },
          ).catch((error) => {
            console.error(
              'Error loading canvas.dataset.echartsConfigUrl "' + configURL +
                '": ',
              error,
            );
          });
        } else {
          if (target.innerHTML) {
            const telemetry = self.telemetrySpan(
              `populate ECharts ('${self.target.targetID}'.innerHTML)`,
            );
            const config = JSON.parse(target.innerHTML);
            target.innerHTML = ""; // clear it so that ECharts will render
            target.style.display = ""; // in case the block was hidden on load to remove flicker
            configure(config, telemetry);
          }
        }
      },
    );
  }
}

class AgGridContent extends Content {
  static isAgGridContent(targetID, options) {
    const target = new Target(targetID);
    if (target && ("aggridTarget" in target.element().dataset)) {
      return new AgGridContent(target, options);
    }
    return undefined;
  }

  populate(options) {
    // deno-lint-ignore no-this-alias
    const self = this;
    $script(
      "https://unpkg.com/ag-grid-community/dist/ag-grid-community.min.js",
      function () {
        const target = self.target.element();
        const configure = (gridDefn, telemetry) => {
          const config = {
            domLayout: ("aggridConfigAutoHeight" in target.dataset)
              ? "autoHeight"
              : "normal",
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
          new agGrid.Grid(target, config);
          telemetry.complete(options);
        };

        if (target.dataset.aggridConfigUrl) {
          const configURL = options?.transformURL
            ? options.transformURL(target.dataset.aggridConfigUrl)
            : target.dataset.aggridConfigUrl;
          const telemetry = self.telemetrySpan(
            `populate AG Grid (${configURL})`,
          );
          fetch(configURL).then(
            function (response) {
              if (response.status == 200) {
                response.json().then(function (data) {
                  configure(data, telemetry);
                });
              } else {
                console.error(
                  'Error loading canvas.dataset.aggridConfigUrl "' + configURL +
                    '": response.status = ',
                  response.status,
                );
              }
            },
          ).catch((error) => {
            console.error(
              'Error loading canvas.dataset.aggridConfigUrl "' + configURL +
                '": ',
              error,
            );
          });
        } else {
          if (target.innerHTML) {
            const telemetry = self.telemetrySpan(
              `populate AG Grid ('${self.target.targetID}'.innerHTML)`,
            );
            const gridDefn = JSON.parse(target.innerHTML);
            target.innerHTML = ""; // clear it so that agGrid will render
            target.style.display = ""; // in case the block was hidden on load to remove flicker
            configure(gridDefn, telemetry);
          }
        }
      },
    );
  }
}

/**
 * KrokiContent can find and generate Kroi diagrams in HTML content using `div`s
 * `pre`s or other containers defined like this:
 *
 *     <pre id="diagram1" class="kroki-diagram" style="display: none">
 *     @startuml
 *     ...
 *     @enduml
 *     </pre>
 *
 * Any element like `div` or `pre` can be used as the container but `pre` is
 * nicer for Markdown because it leaves the contents alone. `pre` would allow
 * Kroki content to be untouched in Markdown while `div` would pre-process
 * Markdown inside the `div`.
 *
 * An id attribute is required but all other attributes are optional. Optional
 * attributes are all prefixed with `data-*` and include:
 *
 * - data-host [defaults to http://kroki.io]
 * - data-diagram [defaults to 'plantuml']
 * - data-output [default to 'svg']
 * - data-diagnose [default to false, set to see diagnostics in console]
 *
 * You can find and populate Kroki content using something like this:
 *
 *     KrokiContent.populateAll("pre.kroki-diagram[id]")
 *
 * The `verbose` option will emit discovered content in browser's console.
 */
class KrokiContent extends Content {
  static populateAll(selector, options) {
    const verbose = options?.verbose;
    document.querySelectorAll(selector).forEach((elem) => {
      const content = new KrokiContent(new Target(elem.id), options);
      if (content) {
        content.populate(options);
        if (elem.dataset.diagnose || verbose) {
          content.reportState(options);
        }
      }
    });
  }

  populate(options) {
    // deno-lint-ignore no-this-alias
    const self = this;
    $script(
      "https://unpkg.com/pako@1.0.10/dist/pako_deflate.min.js",
      function () {
        const encodedKrokiUrlPath = (srcText, srcTextType) => {
          if (
            (!srcText || !(typeof srcText === "string") ||
              srcText.trim().length == 0) ||
            (!srcTextType || srcTextType.trim().length == 0)
          ) {
            srcText = "digraph G { Missing -> srcText }";
            srcTextType = "dot";
          }
          let base64Encoded;
          if (window.TextEncoder) {
            base64Encoded = new TextEncoder("utf-8").encode(srcText);
          } else {
            const utf8 = unescape(encodeURIComponent(srcText));
            const base64Encoded = new Uint8Array(utf8.length);
            for (let i = 0; i < utf8.length; i++) {
              base64Encoded[i] = utf8.charCodeAt(i);
            }
          }
          const compressed = pako.deflate(base64Encoded, {
            level: 9,
            to: "string",
          });
          return btoa(compressed).replace(/\+/g, "-").replace(/\//g, "_");
        };

        const target = self.target.element();
        const diagram = target.innerHTML;
        if (diagram) {
          const diagramType = target.dataset.diagram || "plantuml";
          const telemetry = self.telemetrySpan(`populate Kroki ${diagramType}`);
          const host = target.dataset.host || "http://kroki.io";
          const output = target.dataset.output || "svg";
          const diagnose = target.dataset.diagnose;
          const krokiURL = [
            host,
            diagramType,
            output,
            encodedKrokiUrlPath(diagram, diagramType),
          ].join("/");
          if (diagnose || options?.verbose) {
            console.dir({ host, diagramType, output, diagram, krokiURL });
          }
          target.outerHTML =
            `<div><a href='${krokiURL}'><img src='${krokiURL}'/></a></div>`;
          target.style.display = ""; // in case the block was hidden on load to remove flicker
          telemetry.complete(options);
        }
      },
    );
  }
}

class Board {
  constructor(name) {
    this.name = name;
    this.nature = "Dashboard";
    this.content = [];
    this.contentByName = {};
    this.contentDetectors = [
      ChartJsContent.isChartJsContent,
      EChartsContent.isEChartsContent,
      AgGridContent.isAgGridContent,
    ];
  }

  register(content) {
    this.content.push(content);
    this.contentByName[content.target.targetID] = content;
    return content;
  }

  discoverTarget(targetID, options) {
    for (const detector of this.contentDetectors) {
      const content = detector(targetID, options);
      if (content) return content;
    }
    return undefined;
  }

  discoverTargets(options) {
    const verbose = options?.verbose;
    // TODO: instead of hardcoding the selectors, get the selectors from the content detectors
    document.querySelectorAll(
      "[data-chartjs-target], [data-echarts-target], [data-aggrid-target]",
    ).forEach((c) => {
      const content = this.discoverTarget(c.id, options);
      if (content) {
        this.register(content);
        if (verbose) content.reportState({ parent: this, ...options });
      }
    });
  }

  populate(options) {
    this.content.forEach((w) => w.populate({ parent: this, ...options }));
  }
}
