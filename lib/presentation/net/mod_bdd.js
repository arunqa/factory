export function describeModule(dependencies) {
    const { assert, inspectUrlHttpHeaders, httpEndpointAvailableAction } = dependencies;

    describe("mod", () => {
        it("inspectUrlHttpHeaders", () => {
            inspectUrlHttpHeaders({
                onHeaders: (headers) => {
                    assert(headers);
                    assert(typeof headers === "object");
                },
                onHeader: {
                    "content-length": (value, key, alias, url) => {
                        assert(key == "content-length");
                        assert(value > 0);
                        assert(alias == "contentLength");
                        assert(url);
                    },
                    "contentLength": (value, key, alias, url) => {
                        assert(key == "contentLength");
                        assert(value > 0);
                        assert(alias == "content-length");
                        assert(url);
                    },
                }
            });
        });

        it("httpEndpointAvailableAction", () => {
            httpEndpointAvailableAction("/", (httpEAA) => {
                // console.log("action", event);
            }, {
                onInvalidStatus: (event) => {
                    // console.log("onInvalidStatus", event);
                }
            });
        });
    });
}
