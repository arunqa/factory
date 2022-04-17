// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

if (typeof JSON.decycle !== "function") {
    JSON.decycle = function decycle(object, replacer) {
        "use strict";
        var objects = new WeakMap();
        return function derez(value, path) {
            var old_path;
            var nu;
            if (replacer !== undefined) {
                value = replacer(value);
            }
            if (typeof value === "object" && value !== null && !(value instanceof Boolean) && !(value instanceof Date) && !(value instanceof Number) && !(value instanceof RegExp) && !(value instanceof String)) {
                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {
                        $ref: old_path
                    };
                }
                objects.set(value, path);
                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function(element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {
                    nu = {};
                    Object.keys(value).forEach(function(name) {
                        nu[name] = derez(value[name], path + "[" + JSON.stringify(name) + "]");
                    });
                }
                return nu;
            }
            return value;
        }(object, "$");
    };
}
if (typeof JSON.retrocycle !== "function") {
    JSON.retrocycle = function retrocycle($) {
        "use strict";
        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
        (function rez(value) {
            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function(element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function(name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        })($);
        return $;
    };
}
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define([
        "exports"
    ], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).Popper = {});
}(this, function(e1) {
    "use strict";
    function t1(e) {
        if (null == e) return window;
        if ("[object Window]" !== e.toString()) {
            var t = e.ownerDocument;
            return t && t.defaultView || window;
        }
        return e;
    }
    function n1(e) {
        return e instanceof t1(e).Element || e instanceof Element;
    }
    function r1(e) {
        return e instanceof t1(e).HTMLElement || e instanceof HTMLElement;
    }
    function o1(e) {
        return "undefined" != typeof ShadowRoot && (e instanceof t1(e).ShadowRoot || e instanceof ShadowRoot);
    }
    var i1 = Math.max, a1 = Math.min, s1 = Math.round;
    function f1(e, t) {
        void 0 === t && (t = !1);
        var n = e.getBoundingClientRect(), o = 1, i = 1;
        if (r1(e) && t) {
            var a = e.offsetHeight, f = e.offsetWidth;
            f > 0 && (o = s1(n.width) / f || 1), a > 0 && (i = s1(n.height) / a || 1);
        }
        return {
            width: n.width / o,
            height: n.height / i,
            top: n.top / i,
            right: n.right / o,
            bottom: n.bottom / i,
            left: n.left / o,
            x: n.left / o,
            y: n.top / i
        };
    }
    function c1(e) {
        var n = t1(e);
        return {
            scrollLeft: n.pageXOffset,
            scrollTop: n.pageYOffset
        };
    }
    function p1(e) {
        return e ? (e.nodeName || "").toLowerCase() : null;
    }
    function u1(e) {
        return ((n1(e) ? e.ownerDocument : e.document) || window.document).documentElement;
    }
    function l1(e) {
        return f1(u1(e)).left + c1(e).scrollLeft;
    }
    function d1(e) {
        return t1(e).getComputedStyle(e);
    }
    function h1(e) {
        var t = d1(e), n = t.overflow, r = t.overflowX, o = t.overflowY;
        return /auto|scroll|overlay|hidden/.test(n + o + r);
    }
    function m1(e2, n2, o) {
        void 0 === o && (o = !1);
        var i, a, d = r1(n2), m = r1(n2) && function(e) {
            var t = e.getBoundingClientRect(), n = s1(t.width) / e.offsetWidth || 1, r = s1(t.height) / e.offsetHeight || 1;
            return 1 !== n || 1 !== r;
        }(n2), v = u1(n2), g = f1(e2, m), y = {
            scrollLeft: 0,
            scrollTop: 0
        }, b = {
            x: 0,
            y: 0
        };
        return (d || !d && !o) && (("body" !== p1(n2) || h1(v)) && (y = (i = n2) !== t1(i) && r1(i) ? {
            scrollLeft: (a = i).scrollLeft,
            scrollTop: a.scrollTop
        } : c1(i)), r1(n2) ? ((b = f1(n2, !0)).x += n2.clientLeft, b.y += n2.clientTop) : v && (b.x = l1(v))), {
            x: g.left + y.scrollLeft - b.x,
            y: g.top + y.scrollTop - b.y,
            width: g.width,
            height: g.height
        };
    }
    function v1(e) {
        var t = f1(e), n = e.offsetWidth, r = e.offsetHeight;
        return Math.abs(t.width - n) <= 1 && (n = t.width), Math.abs(t.height - r) <= 1 && (r = t.height), {
            x: e.offsetLeft,
            y: e.offsetTop,
            width: n,
            height: r
        };
    }
    function g1(e) {
        return "html" === p1(e) ? e : e.assignedSlot || e.parentNode || (o1(e) ? e.host : null) || u1(e);
    }
    function y1(e) {
        return [
            "html",
            "body",
            "#document"
        ].indexOf(p1(e)) >= 0 ? e.ownerDocument.body : r1(e) && h1(e) ? e : y1(g1(e));
    }
    function b1(e, n) {
        var r;
        void 0 === n && (n = []);
        var o = y1(e), i = o === (null == (r = e.ownerDocument) ? void 0 : r.body), a = t1(o), s = i ? [
            a
        ].concat(a.visualViewport || [], h1(o) ? o : []) : o, f = n.concat(s);
        return i ? f : f.concat(b1(g1(s)));
    }
    function x1(e) {
        return [
            "table",
            "td",
            "th"
        ].indexOf(p1(e)) >= 0;
    }
    function w1(e) {
        return r1(e) && "fixed" !== d1(e).position ? e.offsetParent : null;
    }
    function O1(e3) {
        for(var n3 = t1(e3), i2 = w1(e3); i2 && x1(i2) && "static" === d1(i2).position;)i2 = w1(i2);
        return i2 && ("html" === p1(i2) || "body" === p1(i2) && "static" === d1(i2).position) ? n3 : i2 || function(e) {
            var t = -1 !== navigator.userAgent.toLowerCase().indexOf("firefox");
            if (-1 !== navigator.userAgent.indexOf("Trident") && r1(e) && "fixed" === d1(e).position) return null;
            var n = g1(e);
            for(o1(n) && (n = n.host); r1(n) && [
                "html",
                "body"
            ].indexOf(p1(n)) < 0;){
                var i = d1(n);
                if ("none" !== i.transform || "none" !== i.perspective || "paint" === i.contain || -1 !== [
                    "transform",
                    "perspective"
                ].indexOf(i.willChange) || t && "filter" === i.willChange || t && i.filter && "none" !== i.filter) return n;
                n = n.parentNode;
            }
            return null;
        }(e3) || n3;
    }
    var j = "top", E = "bottom", D = "right", A1 = "left", L1 = "auto", P1 = [
        j,
        E,
        D,
        A1
    ], M1 = "start", k1 = "end", W1 = "viewport", B1 = "popper", H1 = P1.reduce(function(e, t) {
        return e.concat([
            t + "-" + M1,
            t + "-" + k1
        ]);
    }, []), T1 = [].concat(P1, [
        L1
    ]).reduce(function(e, t) {
        return e.concat([
            t,
            t + "-" + M1,
            t + "-" + k1
        ]);
    }, []), R1 = [
        "beforeRead",
        "read",
        "afterRead",
        "beforeMain",
        "main",
        "afterMain",
        "beforeWrite",
        "write",
        "afterWrite"
    ];
    function S1(e4) {
        var t = new Map, n = new Set, r2 = [];
        function o(e5) {
            n.add(e5.name), [].concat(e5.requires || [], e5.requiresIfExists || []).forEach(function(e) {
                if (!n.has(e)) {
                    var r = t.get(e);
                    r && o(r);
                }
            }), r2.push(e5);
        }
        return e4.forEach(function(e) {
            t.set(e.name, e);
        }), e4.forEach(function(e) {
            n.has(e.name) || o(e);
        }), r2;
    }
    function C1(e) {
        return e.split("-")[0];
    }
    function q1(e, t) {
        var n = t.getRootNode && t.getRootNode();
        if (e.contains(t)) return !0;
        if (n && o1(n)) {
            var r = t;
            do {
                if (r && e.isSameNode(r)) return !0;
                r = r.parentNode || r.host;
            }while (r)
        }
        return !1;
    }
    function V1(e) {
        return Object.assign({}, e, {
            left: e.x,
            top: e.y,
            right: e.x + e.width,
            bottom: e.y + e.height
        });
    }
    function N1(e6, r3) {
        return r3 === W1 ? V1(function(e) {
            var n = t1(e), r = u1(e), o = n.visualViewport, i = r.clientWidth, a = r.clientHeight, s = 0, f = 0;
            return o && (i = o.width, a = o.height, /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (s = o.offsetLeft, f = o.offsetTop)), {
                width: i,
                height: a,
                x: s + l1(e),
                y: f
            };
        }(e6)) : n1(r3) ? function(e) {
            var t = f1(e);
            return t.top = t.top + e.clientTop, t.left = t.left + e.clientLeft, t.bottom = t.top + e.clientHeight, t.right = t.left + e.clientWidth, t.width = e.clientWidth, t.height = e.clientHeight, t.x = t.left, t.y = t.top, t;
        }(r3) : V1(function(e) {
            var t, n = u1(e), r = c1(e), o = null == (t = e.ownerDocument) ? void 0 : t.body, a = i1(n.scrollWidth, n.clientWidth, o ? o.scrollWidth : 0, o ? o.clientWidth : 0), s = i1(n.scrollHeight, n.clientHeight, o ? o.scrollHeight : 0, o ? o.clientHeight : 0), f = -r.scrollLeft + l1(e), p = -r.scrollTop;
            return "rtl" === d1(o || n).direction && (f += i1(n.clientWidth, o ? o.clientWidth : 0) - a), {
                width: a,
                height: s,
                x: f,
                y: p
            };
        }(u1(e6)));
    }
    function I1(e7, t2, o2) {
        var s = "clippingParents" === t2 ? function(e8) {
            var t = b1(g1(e8)), o = [
                "absolute",
                "fixed"
            ].indexOf(d1(e8).position) >= 0 && r1(e8) ? O1(e8) : e8;
            return n1(o) ? t.filter(function(e) {
                return n1(e) && q1(e, o) && "body" !== p1(e);
            }) : [];
        }(e7) : [].concat(t2), f = [].concat(s, [
            o2
        ]), c = f[0], u = f.reduce(function(t, n) {
            var r = N1(e7, n);
            return t.top = i1(r.top, t.top), t.right = a1(r.right, t.right), t.bottom = a1(r.bottom, t.bottom), t.left = i1(r.left, t.left), t;
        }, N1(e7, c));
        return u.width = u.right - u.left, u.height = u.bottom - u.top, u.x = u.left, u.y = u.top, u;
    }
    function _(e) {
        return e.split("-")[1];
    }
    function F1(e) {
        return [
            "top",
            "bottom"
        ].indexOf(e) >= 0 ? "x" : "y";
    }
    function U1(e) {
        var t, n = e.reference, r = e.element, o = e.placement, i = o ? C1(o) : null, a = o ? _(o) : null, s = n.x + n.width / 2 - r.width / 2, f = n.y + n.height / 2 - r.height / 2;
        switch(i){
            case j:
                t = {
                    x: s,
                    y: n.y - r.height
                };
                break;
            case E:
                t = {
                    x: s,
                    y: n.y + n.height
                };
                break;
            case D:
                t = {
                    x: n.x + n.width,
                    y: f
                };
                break;
            case A1:
                t = {
                    x: n.x - r.width,
                    y: f
                };
                break;
            default:
                t = {
                    x: n.x,
                    y: n.y
                };
        }
        var c = i ? F1(i) : null;
        if (null != c) {
            var p = "y" === c ? "height" : "width";
            switch(a){
                case M1:
                    t[c] = t[c] - (n[p] / 2 - r[p] / 2);
                    break;
                case k1:
                    t[c] = t[c] + (n[p] / 2 - r[p] / 2);
            }
        }
        return t;
    }
    function z1(e) {
        return Object.assign({}, {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, e);
    }
    function X1(e, t3) {
        return t3.reduce(function(t, n) {
            return t[n] = e, t;
        }, {});
    }
    function Y(e9, t4) {
        void 0 === t4 && (t4 = {});
        var r = t4, o = r.placement, i = void 0 === o ? e9.placement : o, a = r.boundary, s = void 0 === a ? "clippingParents" : a, c = r.rootBoundary, p = void 0 === c ? W1 : c, l = r.elementContext, d = void 0 === l ? B1 : l, h = r.altBoundary, m = void 0 !== h && h, v = r.padding, g = void 0 === v ? 0 : v, y = z1("number" != typeof g ? g : X1(g, P1)), b = d === B1 ? "reference" : B1, x = e9.rects.popper, w = e9.elements[m ? b : d], O = I1(n1(w) ? w : w.contextElement || u1(e9.elements.popper), s, p), A = f1(e9.elements.reference), L = U1({
            reference: A,
            element: x,
            strategy: "absolute",
            placement: i
        }), M = V1(Object.assign({}, x, L)), k = d === B1 ? M : A, H = {
            top: O.top - k.top + y.top,
            bottom: k.bottom - O.bottom + y.bottom,
            left: O.left - k.left + y.left,
            right: k.right - O.right + y.right
        }, T = e9.modifiersData.offset;
        if (d === B1 && T) {
            var R = T[i];
            Object.keys(H).forEach(function(e) {
                var t = [
                    D,
                    E
                ].indexOf(e) >= 0 ? 1 : -1, n = [
                    j,
                    E
                ].indexOf(e) >= 0 ? "y" : "x";
                H[e] += R[n] * t;
            });
        }
        return H;
    }
    var G1 = {
        placement: "bottom",
        modifiers: [],
        strategy: "absolute"
    };
    function J1() {
        for(var e10 = arguments.length, t = new Array(e10), n = 0; n < e10; n++)t[n] = arguments[n];
        return !t.some(function(e) {
            return !(e && "function" == typeof e.getBoundingClientRect);
        });
    }
    function K1(e11) {
        void 0 === e11 && (e11 = {});
        var t5 = e11, r4 = t5.defaultModifiers, o3 = void 0 === r4 ? [] : r4, i3 = t5.defaultOptions, a2 = void 0 === i3 ? G1 : i3;
        return function(e12, t6, r5) {
            void 0 === r5 && (r5 = a2);
            var i4, s2, f = {
                placement: "bottom",
                orderedModifiers: [],
                options: Object.assign({}, G1, a2),
                modifiersData: {},
                elements: {
                    reference: e12,
                    popper: t6
                },
                attributes: {},
                styles: {}
            }, c2 = [], p2 = !1, u = {
                state: f,
                setOptions: function(r6) {
                    var i5 = "function" == typeof r6 ? r6(f.options) : r6;
                    l(), f.options = Object.assign({}, a2, f.options, i5), f.scrollParents = {
                        reference: n1(e12) ? b1(e12) : e12.contextElement ? b1(e12.contextElement) : [],
                        popper: b1(t6)
                    };
                    var s, p, d = function(e13) {
                        var t = S1(e13);
                        return R1.reduce(function(e14, n) {
                            return e14.concat(t.filter(function(e) {
                                return e.phase === n;
                            }));
                        }, []);
                    }((s = [].concat(o3, f.options.modifiers), p = s.reduce(function(e, t) {
                        var n = e[t.name];
                        return e[t.name] = n ? Object.assign({}, n, t, {
                            options: Object.assign({}, n.options, t.options),
                            data: Object.assign({}, n.data, t.data)
                        }) : t, e;
                    }, {}), Object.keys(p).map(function(e) {
                        return p[e];
                    })));
                    return f.orderedModifiers = d.filter(function(e) {
                        return e.enabled;
                    }), f.orderedModifiers.forEach(function(e) {
                        var t = e.name, n = e.options, r = void 0 === n ? {} : n, o = e.effect;
                        if ("function" == typeof o) {
                            var i = o({
                                state: f,
                                name: t,
                                instance: u,
                                options: r
                            }), a = function() {};
                            c2.push(i || a);
                        }
                    }), u.update();
                },
                forceUpdate: function() {
                    if (!p2) {
                        var e15 = f.elements, t = e15.reference, n = e15.popper;
                        if (J1(t, n)) {
                            f.rects = {
                                reference: m1(t, O1(n), "fixed" === f.options.strategy),
                                popper: v1(n)
                            }, f.reset = !1, f.placement = f.options.placement, f.orderedModifiers.forEach(function(e) {
                                return f.modifiersData[e.name] = Object.assign({}, e.data);
                            });
                            for(var r = 0; r < f.orderedModifiers.length; r++)if (!0 !== f.reset) {
                                var o = f.orderedModifiers[r], i = o.fn, a = o.options, s = void 0 === a ? {} : a, c = o.name;
                                "function" == typeof i && (f = i({
                                    state: f,
                                    options: s,
                                    name: c,
                                    instance: u
                                }) || f);
                            } else f.reset = !1, r = -1;
                        }
                    }
                },
                update: (i4 = function() {
                    return new Promise(function(e) {
                        u.forceUpdate(), e(f);
                    });
                }, function() {
                    return s2 || (s2 = new Promise(function(e) {
                        Promise.resolve().then(function() {
                            s2 = void 0, e(i4());
                        });
                    })), s2;
                }),
                destroy: function() {
                    l(), p2 = !0;
                }
            };
            if (!J1(e12, t6)) return u;
            function l() {
                c2.forEach(function(e) {
                    return e();
                }), c2 = [];
            }
            return u.setOptions(r5).then(function(e) {
                !p2 && r5.onFirstUpdate && r5.onFirstUpdate(e);
            }), u;
        };
    }
    var Q1 = {
        passive: !0
    };
    var Z1 = {
        name: "eventListeners",
        enabled: !0,
        phase: "write",
        fn: function() {},
        effect: function(e17) {
            var n = e17.state, r = e17.instance, o = e17.options, i = o.scroll, a = void 0 === i || i, s = o.resize, f = void 0 === s || s, c = t1(n.elements.popper), p = [].concat(n.scrollParents.reference, n.scrollParents.popper);
            return a && p.forEach(function(e) {
                e.addEventListener("scroll", r.update, Q1);
            }), f && c.addEventListener("resize", r.update, Q1), function() {
                a && p.forEach(function(e) {
                    e.removeEventListener("scroll", r.update, Q1);
                }), f && c.removeEventListener("resize", r.update, Q1);
            };
        },
        data: {}
    };
    var $1 = {
        name: "popperOffsets",
        enabled: !0,
        phase: "read",
        fn: function(e) {
            var t = e.state, n = e.name;
            t.modifiersData[n] = U1({
                reference: t.rects.reference,
                element: t.rects.popper,
                strategy: "absolute",
                placement: t.placement
            });
        },
        data: {}
    }, ee1 = {
        top: "auto",
        right: "auto",
        bottom: "auto",
        left: "auto"
    };
    function te1(e18) {
        var n4, r7 = e18.popper, o = e18.popperRect, i = e18.placement, a = e18.variation, f = e18.offsets, c = e18.position, p = e18.gpuAcceleration, l = e18.adaptive, h = e18.roundOffsets, m = e18.isFixed, v = f.x, g = void 0 === v ? 0 : v, y = f.y, b = void 0 === y ? 0 : y, x = "function" == typeof h ? h({
            x: g,
            y: b
        }) : {
            x: g,
            y: b
        };
        g = x.x, b = x.y;
        var w = f.hasOwnProperty("x"), L = f.hasOwnProperty("y"), P = A1, M = j, W = window;
        if (l) {
            var B = O1(r7), H = "clientHeight", T = "clientWidth";
            if (B === t1(r7) && "static" !== d1(B = u1(r7)).position && "absolute" === c && (H = "scrollHeight", T = "scrollWidth"), B = B, i === j || (i === A1 || i === D) && a === k1) M = E, b -= (m && B === W && W.visualViewport ? W.visualViewport.height : B[H]) - o.height, b *= p ? 1 : -1;
            if (i === A1 || (i === j || i === E) && a === k1) P = D, g -= (m && B === W && W.visualViewport ? W.visualViewport.width : B[T]) - o.width, g *= p ? 1 : -1;
        }
        var R, S = Object.assign({
            position: c
        }, l && ee1), C = !0 === h ? function(e) {
            var t = e.x, n = e.y, r = window.devicePixelRatio || 1;
            return {
                x: s1(t * r) / r || 0,
                y: s1(n * r) / r || 0
            };
        }({
            x: g,
            y: b
        }) : {
            x: g,
            y: b
        };
        return g = C.x, b = C.y, p ? Object.assign({}, S, ((R = {})[M] = L ? "0" : "", R[P] = w ? "0" : "", R.transform = (W.devicePixelRatio || 1) <= 1 ? "translate(" + g + "px, " + b + "px)" : "translate3d(" + g + "px, " + b + "px, 0)", R)) : Object.assign({}, S, ((n4 = {})[M] = L ? b + "px" : "", n4[P] = w ? g + "px" : "", n4.transform = "", n4));
    }
    var ne1 = {
        name: "computeStyles",
        enabled: !0,
        phase: "beforeWrite",
        fn: function(e) {
            var t = e.state, n = e.options, r = n.gpuAcceleration, o = void 0 === r || r, i = n.adaptive, a = void 0 === i || i, s = n.roundOffsets, f = void 0 === s || s, c = {
                placement: C1(t.placement),
                variation: _(t.placement),
                popper: t.elements.popper,
                popperRect: t.rects.popper,
                gpuAcceleration: o,
                isFixed: "fixed" === t.options.strategy
            };
            null != t.modifiersData.popperOffsets && (t.styles.popper = Object.assign({}, t.styles.popper, te1(Object.assign({}, c, {
                offsets: t.modifiersData.popperOffsets,
                position: t.options.strategy,
                adaptive: a,
                roundOffsets: f
            })))), null != t.modifiersData.arrow && (t.styles.arrow = Object.assign({}, t.styles.arrow, te1(Object.assign({}, c, {
                offsets: t.modifiersData.arrow,
                position: "absolute",
                adaptive: !1,
                roundOffsets: f
            })))), t.attributes.popper = Object.assign({}, t.attributes.popper, {
                "data-popper-placement": t.placement
            });
        },
        data: {}
    };
    var re1 = {
        name: "applyStyles",
        enabled: !0,
        phase: "write",
        fn: function(e19) {
            var t7 = e19.state;
            Object.keys(t7.elements).forEach(function(e20) {
                var n = t7.styles[e20] || {}, o = t7.attributes[e20] || {}, i = t7.elements[e20];
                r1(i) && p1(i) && (Object.assign(i.style, n), Object.keys(o).forEach(function(e) {
                    var t = o[e];
                    !1 === t ? i.removeAttribute(e) : i.setAttribute(e, !0 === t ? "" : t);
                }));
            });
        },
        effect: function(e21) {
            var t8 = e21.state, n = {
                popper: {
                    position: t8.options.strategy,
                    left: "0",
                    top: "0",
                    margin: "0"
                },
                arrow: {
                    position: "absolute"
                },
                reference: {}
            };
            return Object.assign(t8.elements.popper.style, n.popper), t8.styles = n, t8.elements.arrow && Object.assign(t8.elements.arrow.style, n.arrow), function() {
                Object.keys(t8.elements).forEach(function(e22) {
                    var o = t8.elements[e22], i = t8.attributes[e22] || {}, a = Object.keys(t8.styles.hasOwnProperty(e22) ? t8.styles[e22] : n[e22]).reduce(function(e, t) {
                        return e[t] = "", e;
                    }, {});
                    r1(o) && p1(o) && (Object.assign(o.style, a), Object.keys(i).forEach(function(e) {
                        o.removeAttribute(e);
                    }));
                });
            };
        },
        requires: [
            "computeStyles"
        ]
    };
    var oe1 = {
        name: "offset",
        enabled: !0,
        phase: "main",
        requires: [
            "popperOffsets"
        ],
        fn: function(e23) {
            var t9 = e23.state, n5 = e23.options, r8 = e23.name, o4 = n5.offset, i6 = void 0 === o4 ? [
                0,
                0
            ] : o4, a3 = T1.reduce(function(e24, n6) {
                return e24[n6] = function(e, t, n) {
                    var r = C1(e), o = [
                        A1,
                        j
                    ].indexOf(r) >= 0 ? -1 : 1, i = "function" == typeof n ? n(Object.assign({}, t, {
                        placement: e
                    })) : n, a = i[0], s = i[1];
                    return a = a || 0, s = (s || 0) * o, [
                        A1,
                        D
                    ].indexOf(r) >= 0 ? {
                        x: s,
                        y: a
                    } : {
                        x: a,
                        y: s
                    };
                }(n6, t9.rects, i6), e24;
            }, {}), s3 = a3[t9.placement], f = s3.x, c = s3.y;
            null != t9.modifiersData.popperOffsets && (t9.modifiersData.popperOffsets.x += f, t9.modifiersData.popperOffsets.y += c), t9.modifiersData[r8] = a3;
        }
    }, ie1 = {
        left: "right",
        right: "left",
        bottom: "top",
        top: "bottom"
    };
    function ae1(e25) {
        return e25.replace(/left|right|bottom|top/g, function(e) {
            return ie1[e];
        });
    }
    var se1 = {
        start: "end",
        end: "start"
    };
    function fe1(e26) {
        return e26.replace(/start|end/g, function(e) {
            return se1[e];
        });
    }
    function ce1(e27, t10) {
        void 0 === t10 && (t10 = {});
        var n7 = t10, r = n7.placement, o = n7.boundary, i = n7.rootBoundary, a = n7.padding, s = n7.flipVariations, f = n7.allowedAutoPlacements, c = void 0 === f ? T1 : f, p = _(r), u = p ? s ? H1 : H1.filter(function(e) {
            return _(e) === p;
        }) : P1, l = u.filter(function(e) {
            return c.indexOf(e) >= 0;
        });
        0 === l.length && (l = u);
        var d = l.reduce(function(t, n) {
            return t[n] = Y(e27, {
                placement: n,
                boundary: o,
                rootBoundary: i,
                padding: a
            })[C1(n)], t;
        }, {});
        return Object.keys(d).sort(function(e, t) {
            return d[e] - d[t];
        });
    }
    var pe1 = {
        name: "flip",
        enabled: !0,
        phase: "main",
        fn: function(e28) {
            var t11 = e28.state, n8 = e28.options, r = e28.name;
            if (!t11.modifiersData[r]._skip) {
                for(var o = n8.mainAxis, i = void 0 === o || o, a = n8.altAxis, s = void 0 === a || a, f = n8.fallbackPlacements, c = n8.padding, p = n8.boundary, u = n8.rootBoundary, l = n8.altBoundary, d = n8.flipVariations, h = void 0 === d || d, m = n8.allowedAutoPlacements, v = t11.options.placement, g = C1(v), y = f || (g === v || !h ? [
                    ae1(v)
                ] : function(e) {
                    if (C1(e) === L1) return [];
                    var t = ae1(e);
                    return [
                        fe1(e),
                        t,
                        fe1(t)
                    ];
                }(v)), b = [
                    v
                ].concat(y).reduce(function(e, n) {
                    return e.concat(C1(n) === L1 ? ce1(t11, {
                        placement: n,
                        boundary: p,
                        rootBoundary: u,
                        padding: c,
                        flipVariations: h,
                        allowedAutoPlacements: m
                    }) : n);
                }, []), x = t11.rects.reference, w = t11.rects.popper, O = new Map, P = !0, k = b[0], W = 0; W < b.length; W++){
                    var B = b[W], H = C1(B), T = _(B) === M1, R = [
                        j,
                        E
                    ].indexOf(H) >= 0, S = R ? "width" : "height", q = Y(t11, {
                        placement: B,
                        boundary: p,
                        rootBoundary: u,
                        altBoundary: l,
                        padding: c
                    }), V = R ? T ? D : A1 : T ? E : j;
                    x[S] > w[S] && (V = ae1(V));
                    var N = ae1(V), I = [];
                    if (i && I.push(q[H] <= 0), s && I.push(q[V] <= 0, q[N] <= 0), I.every(function(e) {
                        return e;
                    })) {
                        k = B, P = !1;
                        break;
                    }
                    O.set(B, I);
                }
                if (P) for(var F = function(e29) {
                    var t12 = b.find(function(t) {
                        var n = O.get(t);
                        if (n) return n.slice(0, e29).every(function(e) {
                            return e;
                        });
                    });
                    if (t12) return k = t12, "break";
                }, U = h ? 3 : 1; U > 0; U--){
                    if ("break" === F(U)) break;
                }
                t11.placement !== k && (t11.modifiersData[r]._skip = !0, t11.placement = k, t11.reset = !0);
            }
        },
        requiresIfExists: [
            "offset"
        ],
        data: {
            _skip: !1
        }
    };
    function ue(e, t, n) {
        return i1(e, a1(t, n));
    }
    var le1 = {
        name: "preventOverflow",
        enabled: !0,
        phase: "main",
        fn: function(e30) {
            var t13 = e30.state, n9 = e30.options, r9 = e30.name, o = n9.mainAxis, s = void 0 === o || o, f = n9.altAxis, c = void 0 !== f && f, p = n9.boundary, u = n9.rootBoundary, l = n9.altBoundary, d = n9.padding, h = n9.tether, m = void 0 === h || h, g = n9.tetherOffset, y = void 0 === g ? 0 : g, b = Y(t13, {
                boundary: p,
                rootBoundary: u,
                padding: d,
                altBoundary: l
            }), x = C1(t13.placement), w = _(t13.placement), L = !w, P = F1(x), k = "x" === P ? "y" : "x", W = t13.modifiersData.popperOffsets, B = t13.rects.reference, H = t13.rects.popper, T = "function" == typeof y ? y(Object.assign({}, t13.rects, {
                placement: t13.placement
            })) : y, R = "number" == typeof T ? {
                mainAxis: T,
                altAxis: T
            } : Object.assign({
                mainAxis: 0,
                altAxis: 0
            }, T), S = t13.modifiersData.offset ? t13.modifiersData.offset[t13.placement] : null, q = {
                x: 0,
                y: 0
            };
            if (W) {
                if (s) {
                    var V, N = "y" === P ? j : A1, I = "y" === P ? E : D, U = "y" === P ? "height" : "width", z = W[P], X = z + b[N], G = z - b[I], J = m ? -H[U] / 2 : 0, K = w === M1 ? B[U] : H[U], Q = w === M1 ? -H[U] : -B[U], Z = t13.elements.arrow, $ = m && Z ? v1(Z) : {
                        width: 0,
                        height: 0
                    }, ee = t13.modifiersData["arrow#persistent"] ? t13.modifiersData["arrow#persistent"].padding : {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }, te = ee[N], ne = ee[I], re = ue(0, B[U], $[U]), oe = L ? B[U] / 2 - J - re - te - R.mainAxis : K - re - te - R.mainAxis, ie = L ? -B[U] / 2 + J + re + ne + R.mainAxis : Q + re + ne + R.mainAxis, ae = t13.elements.arrow && O1(t13.elements.arrow), se = ae ? "y" === P ? ae.clientTop || 0 : ae.clientLeft || 0 : 0, fe = null != (V = null == S ? void 0 : S[P]) ? V : 0, ce = z + ie - fe, pe = ue(m ? a1(X, z + oe - fe - se) : X, z, m ? i1(G, ce) : G);
                    W[P] = pe, q[P] = pe - z;
                }
                if (c) {
                    var le, de = "x" === P ? j : A1, he = "x" === P ? E : D, me = W[k], ve = "y" === k ? "height" : "width", ge = me + b[de], ye = me - b[he], be = -1 !== [
                        j,
                        A1
                    ].indexOf(x), xe = null != (le = null == S ? void 0 : S[k]) ? le : 0, we = be ? ge : me - B[ve] - H[ve] - xe + R.altAxis, Oe = be ? me + B[ve] + H[ve] - xe - R.altAxis : ye, je = m && be ? function(e, t, n) {
                        var r = ue(e, t, n);
                        return r > n ? n : r;
                    }(we, me, Oe) : ue(m ? we : ge, me, m ? Oe : ye);
                    W[k] = je, q[k] = je - me;
                }
                t13.modifiersData[r9] = q;
            }
        },
        requiresIfExists: [
            "offset"
        ]
    };
    var de1 = {
        name: "arrow",
        enabled: !0,
        phase: "main",
        fn: function(e31) {
            var t14, n = e31.state, r = e31.name, o = e31.options, i = n.elements.arrow, a = n.modifiersData.popperOffsets, s = C1(n.placement), f = F1(s), c = [
                A1,
                D
            ].indexOf(s) >= 0 ? "height" : "width";
            if (i && a) {
                var p = function(e, t) {
                    return z1("number" != typeof (e = "function" == typeof e ? e(Object.assign({}, t.rects, {
                        placement: t.placement
                    })) : e) ? e : X1(e, P1));
                }(o.padding, n), u = v1(i), l = "y" === f ? j : A1, d = "y" === f ? E : D, h = n.rects.reference[c] + n.rects.reference[f] - a[f] - n.rects.popper[c], m = a[f] - n.rects.reference[f], g = O1(i), y = g ? "y" === f ? g.clientHeight || 0 : g.clientWidth || 0 : 0, b = h / 2 - m / 2, x = p[l], w = y - u[c] - p[d], L = y / 2 - u[c] / 2 + b, M = ue(x, L, w), k = f;
                n.modifiersData[r] = ((t14 = {})[k] = M, t14.centerOffset = M - L, t14);
            }
        },
        effect: function(e) {
            var t = e.state, n = e.options.element, r = void 0 === n ? "[data-popper-arrow]" : n;
            null != r && ("string" != typeof r || (r = t.elements.popper.querySelector(r))) && q1(t.elements.popper, r) && (t.elements.arrow = r);
        },
        requires: [
            "popperOffsets"
        ],
        requiresIfExists: [
            "preventOverflow"
        ]
    };
    function he1(e, t, n) {
        return void 0 === n && (n = {
            x: 0,
            y: 0
        }), {
            top: e.top - t.height - n.y,
            right: e.right - t.width + n.x,
            bottom: e.bottom - t.height + n.y,
            left: e.left - t.width - n.x
        };
    }
    function me1(e) {
        return [
            j,
            D,
            E,
            A1
        ].some(function(t) {
            return e[t] >= 0;
        });
    }
    var ve1 = {
        name: "hide",
        enabled: !0,
        phase: "main",
        requiresIfExists: [
            "preventOverflow"
        ],
        fn: function(e) {
            var t = e.state, n = e.name, r = t.rects.reference, o = t.rects.popper, i = t.modifiersData.preventOverflow, a = Y(t, {
                elementContext: "reference"
            }), s = Y(t, {
                altBoundary: !0
            }), f = he1(a, r), c = he1(s, o, i), p = me1(f), u = me1(c);
            t.modifiersData[n] = {
                referenceClippingOffsets: f,
                popperEscapeOffsets: c,
                isReferenceHidden: p,
                hasPopperEscaped: u
            }, t.attributes.popper = Object.assign({}, t.attributes.popper, {
                "data-popper-reference-hidden": p,
                "data-popper-escaped": u
            });
        }
    }, ge1 = K1({
        defaultModifiers: [
            Z1,
            $1,
            ne1,
            re1
        ]
    }), ye1 = [
        Z1,
        $1,
        ne1,
        re1,
        oe1,
        pe1,
        le1,
        de1,
        ve1
    ], be1 = K1({
        defaultModifiers: ye1
    });
    e1.applyStyles = re1, e1.arrow = de1, e1.computeStyles = ne1, e1.createPopper = be1, e1.createPopperLite = ge1, e1.defaultModifiers = ye1, e1.detectOverflow = Y, e1.eventListeners = Z1, e1.flip = pe1, e1.hide = ve1, e1.offset = oe1, e1.popperGenerator = K1, e1.popperOffsets = $1, e1.preventOverflow = le1, Object.defineProperty(e1, "__esModule", {
        value: !0
    });
});
function isBoolean(any) {
    return typeof any === "boolean";
}
function isNull(any) {
    return any === null;
}
function isUndefined(any) {
    return typeof any === "undefined";
}
function isNumber(any) {
    return typeof any === "number";
}
function isString(any) {
    return typeof any === "string";
}
function isSymbol(any) {
    return typeof any === "symbol";
}
function isFunction(any) {
    return typeof any === "function";
}
function reflect(any, ancestors, options) {
    if (isBoolean(any) || isNull(any) || isUndefined(any) || isNumber(any) || isString(any) || isSymbol(any)) {
        const enhanceScalar = options?.enhanceScalar;
        const response = {
            value: any,
            type: typeof any
        };
        if (isSymbol(any)) {
            response.description = any.description;
        }
        return enhanceScalar ? enhanceScalar(response, ancestors) : response;
    }
    if (isFunction(any)) {
        const enhanceFunction = options?.enhanceFunction;
        const fn = {
            value: any,
            name: any.name,
            type: typeof any,
            stringify: any.toString()
        };
        return enhanceFunction ? enhanceFunction(fn, ancestors) : fn;
    }
    const enhanceObject = options?.enhanceObject;
    let propertiesNames = Object.getOwnPropertyNames(any);
    if (options?.objPropsFilter) {
        propertiesNames = propertiesNames.filter(options?.objPropsFilter);
    }
    const symbols = Object.getOwnPropertySymbols(any);
    const obj = {
        value: any,
        type: typeof any,
        properties: propertiesNames.map((prop)=>({
                ...reflect(any[prop], ancestors ? [
                    ...ancestors,
                    any
                ] : [
                    any
                ], options),
                key: prop,
                propertyDescription: Object.getOwnPropertyDescriptor(any, prop)
            })
        ),
        symbols: symbols.map((sym)=>({
                ...reflect(any[sym], ancestors ? [
                    ...ancestors,
                    any
                ] : [
                    any
                ], options),
                key: sym
            })
        ),
        stringify: any.toString()
    };
    return enhanceObject ? enhanceObject(obj) : obj;
}
export { reflect as reflect };
function humanFriendlyBytes(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = si ? [
        "kB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB"
    ] : [
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB"
    ];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    }while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u];
}
function humanFriendlyPhrase(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter)=>letter.toUpperCase()
    );
}
const humanPath = (original, maxLength = 50, formatBasename)=>{
    const tokens = original.split("/");
    const basename = tokens[tokens.length - 1];
    tokens.splice(0, 1);
    tokens.splice(tokens.length - 1, 1);
    if (original.length < maxLength) {
        return (tokens.length > 0 ? tokens.join("/") + "/" : "") + (formatBasename ? formatBasename(basename) : basename);
    }
    const remLen = maxLength - basename.length - 4;
    if (remLen > 0) {
        const path = tokens.join("/");
        const lenA = Math.ceil(remLen / 2);
        const lenB = Math.floor(remLen / 2);
        const pathA = path.substring(0, lenA);
        const pathB = path.substring(path.length - lenB);
        return pathA + "..." + pathB + "/" + (formatBasename ? formatBasename(basename) : basename);
    }
    return formatBasename ? formatBasename(basename) : basename;
};
export { humanFriendlyBytes as humanFriendlyBytes };
export { humanFriendlyPhrase as humanFriendlyPhrase };
export { humanPath as humanPath };
function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r, a)=>Math.min(r, a.length)
    , Infinity) : 0;
}
function unindentWhitespace(text, removeInitialNewLine = true) {
    const indent = minWhitespaceIndent(text);
    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
    const result = text.replace(regex, "");
    return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}
function singleLineTrim(text) {
    return text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ").trim();
}
export { minWhitespaceIndent as minWhitespaceIndent };
export { unindentWhitespace as unindentWhitespace };
export { singleLineTrim as singleLineTrim };
function markdownItTransformer() {
    return {
        dependencies: undefined,
        acquireDependencies: async (transformer)=>{
            const { default: markdownIt  } = await import("https://jspm.dev/markdown-it@12.2.0");
            return {
                markdownIt,
                plugins: await transformer.plugins()
            };
        },
        construct: async (transformer)=>{
            if (!transformer.dependencies) {
                transformer.dependencies = await transformer.acquireDependencies(transformer);
            }
            const markdownIt = transformer.dependencies.markdownIt({
                html: true,
                linkify: true,
                typographer: true
            });
            transformer.customize(markdownIt, transformer);
            return markdownIt;
        },
        customize: (markdownIt, transformer)=>{
            const plugins = transformer.dependencies.plugins;
            markdownIt.use(plugins.footnote);
            return transformer;
        },
        unindentWhitespace: (text, removeInitialNewLine = true)=>{
            const whitespace = text.match(/^[ \t]*(?=\S)/gm);
            const indentCount = whitespace ? whitespace.reduce((r, a)=>Math.min(r, a.length)
            , Infinity) : 0;
            const regex = new RegExp(`^[ \\t]{${indentCount}}`, "gm");
            const result = text.replace(regex, "");
            return removeInitialNewLine ? result.replace(/^\n/, "") : result;
        },
        plugins: async ()=>{
            const { default: footnote  } = await import("https://jspm.dev/markdown-it-footnote@3.0.3");
            return {
                footnote,
                adjustHeadingLevel: (md, options)=>{
                    function getHeadingLevel(tagName) {
                        if (tagName[0].toLowerCase() === 'h') {
                            tagName = tagName.slice(1);
                        }
                        return parseInt(tagName, 10);
                    }
                    const firstLevel = options.firstLevel;
                    if (typeof firstLevel === 'string') {
                        firstLevel = getHeadingLevel(firstLevel);
                    }
                    if (!firstLevel || isNaN(firstLevel)) {
                        return;
                    }
                    const levelOffset = firstLevel - 1;
                    if (levelOffset < 1 || levelOffset > 6) {
                        return;
                    }
                    md.core.ruler.push("adjust-heading-levels", function(state) {
                        const tokens = state.tokens;
                        for(let i = 0; i < tokens.length; i++){
                            if (tokens[i].type !== "heading_close") {
                                continue;
                            }
                            const headingOpen = tokens[i - 2];
                            const headingClose = tokens[i];
                            const currentLevel = getHeadingLevel(headingOpen.tag);
                            const tagName = 'h' + Math.min(currentLevel + levelOffset, 6);
                            headingOpen.tag = tagName;
                            headingClose.tag = tagName;
                        }
                    });
                }
            };
        }
    };
}
async function renderMarkdown(strategies, mditt = markdownItTransformer()) {
    const markdownIt = await mditt.construct(mditt);
    for await (const strategy of strategies(mditt)){
        const markdown = mditt.unindentWhitespace(await strategy.markdownText(mditt));
        strategy.renderHTML(markdownIt.render(markdown), mditt);
    }
}
function importMarkdownContent(input, select, inject) {
    fetch(input).then((resp)=>{
        resp.text().then((html)=>{
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected){
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, input, html);
                }
            } else if (selected) {
                const importedNode = document.adoptNode(selected);
                inject(importedNode, input, html);
            }
        });
    });
}
async function transformMarkdownElemsCustom(srcElems, finalizeElemFn, mditt = markdownItTransformer()) {
    await renderMarkdown(function*() {
        for (const elem of srcElems){
            yield {
                markdownText: async ()=>{
                    if (elem.dataset.transformableSrc) {
                        const response = await fetch(elem.dataset.transformableSrc);
                        if (!response.ok) {
                            return `Error fetching ${elem.dataset.transformableSrc}: ${response.status}`;
                        }
                        return await response.text();
                    } else {
                        return elem.innerText;
                    }
                },
                renderHTML: async (html)=>{
                    try {
                        const formatted = document.createElement("div");
                        formatted.innerHTML = html;
                        elem.parentElement.replaceChild(formatted, elem);
                        if (finalizeElemFn) finalizeElemFn(formatted, elem);
                    } catch (error) {
                        console.error("Undiagnosable error in renderHTML()", error);
                    }
                }
            };
        }
    }, mditt);
}
async function transformMarkdownElems(firstHeadingLevel = 2) {
    const mdittDefaults = markdownItTransformer();
    await transformMarkdownElemsCustom(document.querySelectorAll(`[data-transformable="markdown"]`), (mdHtmlElem, mdSrcElem)=>{
        mdHtmlElem.dataset.transformedFrom = "markdown";
        if (mdSrcElem.className) mdHtmlElem.className = mdSrcElem.className;
        document.dispatchEvent(new CustomEvent("transformed-markdown", {
            detail: {
                mdHtmlElem,
                mdSrcElem
            }
        }));
    }, {
        ...mdittDefaults,
        customize: (markdownIt, transformer)=>{
            mdittDefaults.customize(markdownIt, transformer);
            markdownIt.use(transformer.dependencies.plugins.adjustHeadingLevel, {
                firstLevel: firstHeadingLevel
            });
        }
    });
}
export { markdownItTransformer as markdownItTransformer };
export { renderMarkdown as renderMarkdown };
export { importMarkdownContent as importMarkdownContent };
export { transformMarkdownElemsCustom as transformMarkdownElemsCustom };
export { transformMarkdownElems as transformMarkdownElems };
function getUrlQueryParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
const editableFileRedirectURL = (absPath)=>{
    let src = absPath;
    if (src.startsWith("file://")) {
        src = src.substring(7);
        return [
            `/workspace/editor-redirect/abs${src}`,
            src
        ];
    } else {
        if (absPath.startsWith("/")) {
            return [
                `/workspace/editor-redirect/abs${absPath}`,
                absPath
            ];
        } else {
            return [
                src,
                src
            ];
        }
    }
};
const editableFileRefHTML = (absPath, humanizeLength)=>{
    const [href, label] = editableFileRedirectURL(absPath);
    return humanizeLength ? humanPath(label, humanizeLength, (basename)=>`<a href="${href}" class="fw-bold" title="${absPath}">${basename}</a>`
    ) : `<a href="${href}">${label}</a>`;
};
const locationEditorRedirectURL = (location)=>editableFileRedirectURL(location.moduleImportMetaURL)
;
const locationEditorHTML = (location, humanizeLength)=>{
    const [href, label] = locationEditorRedirectURL(location);
    return humanizeLength ? humanPath(label, humanizeLength, (basename)=>`<a href="${href}" class="fw-bold" title="${location.moduleImportMetaURL}">${basename}</a>`
    ) : `<a href="${href}">${label}</a>`;
};
export { getUrlQueryParameterByName as getUrlQueryParameterByName };
export { editableFileRedirectURL as editableFileRedirectURL };
export { editableFileRefHTML as editableFileRefHTML };
export { locationEditorRedirectURL as locationEditorRedirectURL };
export { locationEditorHTML as locationEditorHTML };
