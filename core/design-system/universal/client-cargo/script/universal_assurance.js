// this script is called universal_assurance.js instead of universal_test so that Deno does not pick it up in unit tests

const assert = chai.assert;

describe("universal-args", () => {
    it("unsafeDomElemsAttrHook", () => {
        const result1 = unsafeDomElemsAttrHook('universal-test-hook-fn');
        assert(result1);
        assert(result1 === universalTestHookFn);

        const hookableDomElems = () => [document.documentElement, document.head, document.body];
        const result2 = unsafeDomElemsAttrHook('universal-test-hook-fn', hookableDomElems, {
            validValue: (value, ctx) => {
                return { hookFn: value, domElem: ctx.elem, hookName: ctx.hookName };
            }
        });
        assert(result2);
        assert(result2.hookFn === universalTestHookFn);
        assert(result2.domElem === document.documentElement);
    });

    it("flexibleArgs with no supplied args and rules object", () => {
        const result = flexibleArgs(undefined, { defaultArgs: { test: "value" } });
        assert(result);
        assert(typeof result === "object");
        assert(result.args.test == "value");
        assert(result.rules.defaultArgs.test == "value");
    });

    it("flexibleArgs with supplied args and rules function", () => {
        const result = flexibleArgs(
            { another: "value" },
            () => ({ defaultArgs: { fromDefaults: "value" } }));  // rules can be a function
        assert(result.args.fromDefaults == "value");
        assert(result.args.another == "value");
        assert(result.rules.defaultArgs.fromDefaults == "value");
    });

    it("flexibleArgs with supplied args function and rules function", () => {
        const result = flexibleArgs(
            (defaults) => ({ ...defaults, another: "value" }), // if argsSupplier is a function, very important that ...defaults is spread
            () => ({ defaultArgs: (rules, args, argsSupplier) => ({ test: "value" }) }));       // rules can be a function, and so can defaultArgs
        assert(result.args.test == "value");    // from defaultArgs
        assert(result.args.another == "value"); // from argsSupplier
    });

    it("flexibleArgs with supplied args object and hookable DOM function", () => {
        const result = flexibleArgs({ test: "value" }, {
            hookableDomElemsAttrName: "universal-test-hook-fn",
            hookableDomElems: [document.documentElement, document.head, document.body],
            onDomHook: (result) => {
                const { domHook } = result;
                assert(domHook.domElem === document.documentElement);
                assert(domHook.hookFn === universalTestHookFn);
                // must return the acceptable result (mutated, or as-is)
                return result;
            },
            //diagnose: (result) => { console.log('flexibleArgs with supplied args object and hookable DOM function', result) },
        });
        assert(result.args.test == "value");
        assert(result.rules);
        assert(result.domHook.domElem === document.documentElement);
        assert(result.domHook.hookFn === universalTestHookFn);
    });

    it("governedArgs", () => {
        governedArgs({ test: "value" }, {
            hookableDomElemsAttrName: "universal-test-hook-fn",
            consumeArgs: ({ args }) => {
                assert(args.test == "value");
            }
        });
    });
});

describe("universal-event-emitter", () => {
    it("flexibleEventEmitter", () => {
        const ee = new EventEmitter();
        const testE1 = "testE1";
        const events = [];
        ee.on(testE1, (event) => {
            events.push(event);
        });
        ee.emit(testE1, { first: true });
        ee.emit(testE1, { second: true });
        assert(events.length == 2);
        assert(events[0].first);
        assert(events[1].second);
    });

    it("flexibleEventEmitter singletons", () => {
        EventEmitter.singletons.declare("test");
        const ees1 = EventEmitter.singletons.instance("test");
        const ees2 = EventEmitter.singletons.instance("test");
        assert(ees1);
        assert(ees2);
        assert(ees1 === ees2);
    });

    it("flexibleEventEmitter singletons with lifecycle events", () => {
        let declared = 0;
        let constructed = 0;
        let accessed = 0;
        const lifecycleEE = new EventEmitter();
        lifecycleEE.on("declared", (ees) => { declared++; })
        lifecycleEE.on("constructed", (ees) => { constructed++; })
        lifecycleEE.on("accessed", (ees) => { accessed++; })
        EventEmitter.singletons.declare("test", { lifecycleEE });
        const ees1 = EventEmitter.singletons.instance("test");
        const ees2 = EventEmitter.singletons.instance("test");
        const ees1Value = ees1.value();
        const ees2Value = ees1.value();
        assert(declared == 1);
        assert(constructed == 1);
        assert(accessed == 2);
        assert(ees1 === ees2);
        assert(ees1Value === ees2Value);
    });

});

describe("universal-HTTP", () => {
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