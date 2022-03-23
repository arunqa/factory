// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function e(e1, t1) {
    for(let r1 in e1)t1(e1[r1], r1);
}
function t(e2, t2) {
    e2.forEach(t2);
}
function r(e3, t3) {
    if (!e3) throw Error(t3);
}
function a({ node: e5 = [] , from: r2 , source: n1 , parent: a1 = r2 || n1 , to: o1 , target: l1 , child: i1 = o1 || l1 , scope: s1 = {} , meta: f1 = {} , family: u1 = {
    type: 'regular'
} , regional: c1  } = {}) {
    let d1 = ge(a1), p1 = ge(u1.links), m1 = ge(u1.owners), g1 = [];
    t(e5, (e6)=>e6 && G(g1, e6)
    );
    let h1 = {
        id: fe(),
        seq: g1,
        next: ge(i1),
        meta: f1,
        scope: s1,
        family: {
            type: u1.type || "crosslink",
            links: p1,
            owners: m1
        }
    };
    return t(p1, (e7)=>G(Q(e7), h1)
    ), t(m1, (e8)=>G(X(e8), h1)
    ), t(d1, (e9)=>G(e9.next, h1)
    ), c1 && ue && me(Z(ue), [
        h1
    ]), h1;
}
function o(e10, r3, n2) {
    let a2 = Xe, o2 = null, l2 = Ge;
    if (e10.target && (r3 = e10.params, n2 = e10.defer, a2 = 'page' in e10 ? e10.page : a2, e10.stack && (o2 = e10.stack), l2 = re(e10) || l2, e10 = e10.target), l2 && Ge && l2 !== Ge && (Ge = null), Array.isArray(e10)) for(let t5 = 0; t5 < e10.length; t5++)Te('pure', a2, K(e10[t5]), o2, r3[t5], l2);
    else Te('pure', a2, K(e10), o2, r3, l2);
    if (n2 && !Je) return;
    let i2, s2, f2, u2, c2, d2, p2 = {
        isRoot: Je,
        currentPage: Xe,
        scope: Ge,
        isWatch: Ke,
        isPure: Qe
    };
    Je = 0;
    e: for(; u2 = Le();){
        let { idx: e11 , stack: r4 , type: n3  } = u2;
        f2 = r4.node, Xe = c2 = r4.page, Ge = re(r4), c2 ? d2 = c2.reg : Ge && (d2 = Ge.reg);
        let a4 = !!c2, o4 = !!Ge, l4 = {
            fail: 0,
            scope: f2.scope
        };
        i2 = s2 = 0;
        for(let t6 = e11; t6 < f2.seq.length && !i2; t6++){
            let u3 = f2.seq[t6];
            if (u3.order) {
                let { priority: a3 , barrierID: o3  } = u3.order, l3 = o3 ? c2 ? `${c2.fullID}_${o3}` : o3 : 0;
                if (t6 !== e11 || n3 !== a3) {
                    o3 ? Ue.has(l3) || (Ue.add(l3), We(t6, r4, a3, o3)) : We(t6, r4, a3);
                    continue e;
                }
                o3 && Ue.delete(l3);
            }
            switch(u3.type){
                case 'mov':
                    {
                        let e12, t7 = u3.data;
                        switch(t7.from){
                            case z:
                                e12 = Z(r4);
                                break;
                            case "a":
                            case 'b':
                                e12 = r4[t7.from];
                                break;
                            case "value":
                                e12 = t7.store;
                                break;
                            case "store":
                                if (d2 && !d2[t7.store.id]) if (a4) {
                                    let e13 = et(c2, t7.store.id);
                                    r4.page = c2 = e13, e13 ? d2 = e13.reg : o4 ? (rt(Ge, t7.store, 0, 1, t7.softRead), d2 = Ge.reg) : d2 = void 0;
                                } else o4 && rt(Ge, t7.store, 0, 1, t7.softRead);
                                e12 = ze(d2 && d2[t7.store.id] || t7.store);
                        }
                        switch(t7.to){
                            case z:
                                r4.value = e12;
                                break;
                            case "a":
                            case 'b':
                                r4[t7.to] = e12;
                                break;
                            case "store":
                                tt(c2, Ge, f2, t7.target).current = e12;
                        }
                        break;
                    }
                case 'compute':
                    let e14 = u3.data;
                    if (e14.fn) {
                        Ke = 'watch' === ne(f2, 'op'), Qe = e14.pure;
                        let t8 = e14.safe ? (0, e14.fn)(Z(r4), l4.scope, r4) : nt(l4, e14.fn, r4);
                        e14.filter ? s2 = !t8 : r4.value = t8, Ke = p2.isWatch, Qe = p2.isPure;
                    }
            }
            i2 = l4.fail || s2;
        }
        if (!i2) {
            let e15 = Z(r4);
            t(f2.next, (t9)=>{
                Te('child', c2, t9, r4, e15, re(r4));
            });
            let n4 = re(r4);
            if (n4) {
                ne(f2, 'needFxCounter') && Te('child', c2, n4.fxCount, r4, e15, n4), ne(f2, 'storeChange') && Te('child', c2, n4.storeChange, r4, e15, n4);
                let a5 = n4.additionalLinks[f2.id];
                a5 && t(a5, (t10)=>{
                    Te('child', c2, t10, r4, e15, n4);
                });
            }
        }
    }
    Je = p2.isRoot, Xe = p2.currentPage, Ge = re(p2);
}
function s(e18, t13) {
    let r6, n6, a8 = e18;
    if (t13) {
        let a7 = oe(t13);
        0 === e18.length ? (r6 = a7.path, n6 = a7.fullName) : (r6 = a7.path.concat([
            e18
        ]), n6 = 0 === a7.fullName.length ? e18 : a7.fullName + '/' + e18);
    } else r6 = 0 === e18.length ? [] : [
        e18
    ], n6 = e18;
    return {
        shortName: a8,
        fullName: n6,
        path: r6
    };
}
function u(e20, ...t15) {
    let r10 = ce();
    if (r10) {
        let n8 = r10.handlers[e20];
        if (n8) return n8(r10, ...t15);
    }
}
function c(e21, t16) {
    let r11 = (e22, ...t17)=>(J(!ne(r11, 'derived'), 'call of derived event', 'createEvent'), J(!Qe, 'unit call from pure function', 'operators like sample'), Xe ? ((e23, t18, r12, n10)=>{
            let a10 = Xe, o6 = null;
            if (t18) for(o6 = Xe; o6 && o6.template !== t18;)o6 = te(o6);
            Ze(o6);
            let l5 = e23.create(r12, n10);
            return Ze(a10), l5;
        })(r11, n9, e22, t17) : r11.create(e22, t17))
    , n9 = ce();
    return Object.assign(r11, {
        graphite: a({
            meta: gt("event", r11, e21, t16),
            regional: 1
        }),
        create: (e24)=>(o({
                target: r11,
                params: e24,
                scope: Ge
            }), e24)
        ,
        watch: (e25)=>pt(r11, e25)
        ,
        map: (e26)=>yt(r11, R, e26, [
                Fe()
            ])
        ,
        filter: (e27)=>yt(r11, "filter", e27.fn ? e27 : e27.fn, [
                Fe(Ce, 1)
            ])
        ,
        filterMap: (e28)=>yt(r11, 'filterMap', e28, [
                Fe(),
                Ne((e29)=>!be(e29)
                , 1)
            ])
        ,
        prepend (e30) {
            let t19 = c('* \u2192 ' + r11.shortName, {
                parent: te(r11)
            });
            return u('eventPrepend', K(t19)), ct(t19, r11, [
                Fe()
            ], 'prepend', e30), mt(r11, t19), t19;
        }
    });
}
function d(e31, n11) {
    let l6 = Re(e31), i3 = ht('updates');
    u('storeBase', l6);
    let s3 = l6.id, f3 = {
        subscribers: new Map,
        updates: i3,
        defaultState: e31,
        stateRef: l6,
        getState () {
            let e32, t21 = l6;
            if (Xe) {
                let t20 = Xe;
                for(; t20 && !t20.reg[s3];)t20 = te(t20);
                t20 && (e32 = t20);
            }
            return !e32 && Ge && (rt(Ge, l6, 1), e32 = Ge), e32 && (t21 = e32.reg[s3]), ze(t21);
        },
        setState: (e33)=>o({
                target: f3,
                params: e33,
                defer: 1,
                scope: Ge
            })
        ,
        reset: (...e34)=>(t(e34, (e35)=>f3.on(e35, ()=>f3.defaultState
                )
            ), f3)
        ,
        on: (e36, r13)=>(we(e36, '.on', 'first argument'), J(!ne(f3, 'derived'), '.on in derived store', 'createStore'), t(Array.isArray(e36) ? e36 : [
                e36
            ], (e37)=>{
                f3.off(e37), ee(f3).set(e37, ut(bt(e37, f3, 'on', $e, r13)));
            }), f3)
        ,
        off (e38) {
            let t22 = ee(f3).get(e38);
            return t22 && (t22(), ee(f3).delete(e38)), f3;
        },
        map (e39, t23) {
            let r14, n12;
            he(e39) && (r14 = e39, e39 = e39.fn), J(be(t23), 'second argument of store.map', 'updateFilter');
            let a11 = f3.getState();
            ce() ? n12 = null : be(a11) || (n12 = e39(a11, t23));
            let o7 = d(n12, {
                name: `${f3.shortName} \u2192 *`,
                derived: 1,
                and: r14
            }), i4 = bt(f3, o7, R, Se, e39);
            return _e(Y(o7), {
                type: R,
                fn: e39,
                from: l6
            }), Y(o7).noInit = 1, u('storeMap', l6, i4), o7;
        },
        watch (e40, t24) {
            if (!t24 || !_(e40)) {
                let t25 = pt(f3, e40);
                return u('storeWatch', l6, e40) || e40(f3.getState()), t25;
            }
            return r(ye(t24), 'second argument should be a function'), e40.watch((e41)=>t24(f3.getState(), e41)
            );
        }
    }, c3 = gt("store", f3, n11), p3 = f3.defaultConfig.updateFilter;
    f3.graphite = a({
        scope: {
            state: l6,
            fn: p3
        },
        node: [
            Ne((e42, t, r15)=>(r15.scope && !r15.scope.reg[l6.id] && (r15.b = 1), e42)
            ),
            Oe(l6),
            Ne((e43, t, { a: r16 , b: n13  })=>!be(e43) && (e43 !== r16 || n13)
            , 1),
            p3 && Fe(Se, 1),
            Ae({
                from: z,
                target: l6
            })
        ],
        child: i3,
        meta: c3,
        regional: 1
    });
    let m2 = ne(f3, 'sid');
    return m2 && ('ignore' !== ne(f3, 'serialize') && ae(f3, 'storeChange', 1), l6.sid = m2), r(ne(f3, 'derived') || !be(e31), "current state can't be undefined, use null instead"), me(f3, [
        i3
    ]), f3;
}
function g() {
    let e48 = {};
    return e48.req = new Promise((t28, r17)=>{
        e48.rs = t28, e48.rj = r17;
    }), e48.req.catch(()=>{}), e48;
}
function h(e49, t29) {
    let n15 = c(ye(e49) ? {
        handler: e49
    } : e49, t29), l8 = K(n15);
    ae(l8, 'op', n15.kind = "effect"), n15.use = (e50)=>(r(ye(e50), '.use argument should be a function'), m3.scope.handler = e50, n15)
    , n15.use.getCurrent = ()=>m3.scope.handler
    ;
    let i6 = n15.finally = ht('finally'), s5 = n15.done = i6.filterMap({
        named: 'done',
        fn ({ status: e51 , params: t30 , result: r18  }) {
            if ('done' === e51) return {
                params: t30,
                result: r18
            };
        }
    }), f4 = n15.fail = i6.filterMap({
        named: 'fail',
        fn ({ status: e52 , params: t31 , error: r19  }) {
            if ('fail' === e52) return {
                params: t31,
                error: r19
            };
        }
    }), u4 = n15.doneData = s5.map({
        named: 'doneData',
        fn: ({ result: e53  })=>e53
    }), p4 = n15.failData = f4.map({
        named: 'failData',
        fn: ({ error: e54  })=>e54
    }), m3 = a({
        scope: {
            handlerId: ne(l8, 'sid'),
            handler: n15.defaultConfig.handler || (()=>r(0, `no handler used in ${n15.getType()}`)
            )
        },
        node: [
            Ne((e56, t32, r20)=>{
                let n16 = t32, a13 = n16.handler;
                if (re(r20)) {
                    let e55 = re(r20).handlers[n16.handlerId];
                    e55 && (a13 = e55);
                }
                return e56.handler = a13, e56;
            }, 0, 1),
            Ne(({ params: e57 , req: t33 , handler: r21 , args: n17 = [
                e57
            ]  }, a, o9)=>{
                let l9 = wt(e57, t33, 1, i6, o9), s6 = wt(e57, t33, 0, i6, o9), [f5, u5] = kt(r21, s6, n17);
                f5 && (he(u5) && ye(u5.then) ? u5.then(l9, s6) : l9(u5));
            }, 0, 1)
        ],
        meta: {
            op: 'fx',
            fx: 'runner'
        }
    });
    l8.scope.runner = m3, G(l8.seq, Ne((e58, { runner: t34  }, r22)=>{
        let n18 = te(r22) ? {
            params: e58,
            req: {
                rs (e) {},
                rj (e) {}
            }
        } : e58;
        return o({
            target: t34,
            params: n18,
            defer: 1,
            scope: re(r22)
        }), n18.params;
    }, 0, 1)), n15.create = (e59)=>{
        let t35 = g(), r23 = {
            params: e59,
            req: t35
        };
        if (Ge) {
            if (!Ke) {
                let e60 = Ge;
                t35.req.finally(()=>{
                    Ye(e60);
                }).catch(()=>{});
            }
            o({
                target: n15,
                params: r23,
                scope: Ge
            });
        } else o(n15, r23);
        return t35.req;
    };
    let h2 = n15.inFlight = d(0, {
        named: 'inFlight'
    }).on(n15, (e61)=>e61 + 1
    ).on(i6, (e62)=>e62 - 1
    );
    ae(i6, 'needFxCounter', 'dec'), ae(n15, 'needFxCounter', 1);
    let y1 = n15.pending = h2.map({
        fn: (e63)=>e63 > 0
        ,
        named: 'pending'
    });
    return me(n15, [
        i6,
        s5,
        f4,
        u4,
        p4,
        y1,
        h2
    ]), n15;
}
function v(r26, n23) {
    let l11 = a({
        family: {
            type: "domain"
        },
        regional: 1
    }), i9 = {
        history: {},
        graphite: l11,
        hooks: {}
    };
    l11.meta = gt("domain", i9, r26, n23), e({
        Event: c,
        Effect: h,
        Store: d,
        Domain: v
    }, (e68, r27)=>{
        let n24 = r27.toLowerCase(), a16 = ht(`on${r27}`);
        i9.hooks[n24] = a16;
        let l12 = new Set;
        i9.history[`${n24}s`] = l12, a16.create = (e69)=>(o(a16, e69), e69)
        , G(K(a16).seq, Ne((e70, t, r28)=>(r28.scope = null, e70)
        )), a16.watch((e71)=>{
            me(i9, [
                e71
            ]), l12.add(e71), e71.ownerSet || (e71.ownerSet = l12), te(e71) || (e71.parent = i9);
        }), me(i9, [
            a16
        ]), i9[`onCreate${r27}`] = (e72)=>(t(l12, e72), a16.watch(e72))
        , i9[`create${r27}`] = i9[n24] = (t39, r29)=>a16(e68(t39, {
                parent: i9,
                or: r29
            }))
        ;
    });
    let s8 = te(i9);
    return s8 && e(i9.hooks, (e73, t40)=>ct(e73, s8.hooks[t40])
    ), i9;
}
let D = 'undefined' != typeof Symbol && Symbol.observable || '@@observable', R = 'map', z = 'stack', _ = (e110)=>(ye(e110) || he(e110)) && 'kind' in e110
;
const P = (e111)=>(t65)=>_(t65) && t65.kind === e111
;
let V = P("store"), E = P("event"), B = P("effect"), L = P("domain"), T = P("scope");
let U = (e113, t67)=>{
    let r48 = e113.indexOf(t67);
    -1 !== r48 && e113.splice(r48, 1);
}, G = (e114, t68)=>e114.push(t68)
, J = (e115, t69, r49)=>!e115 && console.error(`${t69} is deprecated${r49 ? `, use ${r49} instead` : ''}`)
, K = (e116)=>e116.graphite || e116
, Q = (e117)=>e117.family.owners
, X = (e118)=>e118.family.links
, Y = (e119)=>e119.stateRef
, Z = (e120)=>e120.value
, ee = (e121)=>e121.subscribers
, te = (e122)=>e122.parent
, re = (e123)=>e123.scope
, ne = (e124, t70)=>K(e124).meta[t70]
, ae = (e125, t71, r50)=>K(e125).meta[t71] = r50
, oe = (e126)=>e126.compositeName
;
const le = ()=>{
    let e127 = 0;
    return ()=>"" + ++e127
    ;
};
let ie = le(), se = le(), fe = le(), ue = null, ce = ()=>ue && ue.template
, de = (e128)=>(e128 && ue && ue.sidRoot && (e128 = `${ue.sidRoot}|${e128}`), e128)
, me = (e130, r52)=>{
    let n45 = K(e130);
    t(r52, (e131)=>{
        let t73 = K(e131);
        "domain" !== n45.family.type && (t73.family.type = "crosslink"), G(Q(t73), n45), G(X(n45), t73);
    });
}, ge = (e132 = [])=>(Array.isArray(e132) ? e132 : [
        e132
    ]).flat().map(K)
, he = (e133)=>'object' == typeof e133 && null !== e133
, ye = (e134)=>'function' == typeof e134
, be = (e135)=>void 0 === e135
, ve = (e136)=>r(he(e136) || ye(e136), 'expect first argument be an object')
;
const ke = (e137, t74, n46, a31)=>r(!(!he(e137) && !ye(e137) || !('family' in e137) && !('graphite' in e137)), `${t74}: expect ${n46} to be a unit (store, event or effect)${a31}`)
;
let we = (e138, r53, n47)=>{
    Array.isArray(e138) ? t(e138, (e139, t75)=>ke(e139, r53, `${t75} item of ${n47}`, '')
    ) : ke(e138, r53, n47, ' or array of units');
}, Se = (e141, { fn: t77  }, { a: r55  })=>t77(e141, r55)
, $e = (e142, { fn: t78  }, { a: r56  })=>t78(r56, e142)
, Ce = (e143, { fn: t79  })=>t79(e143)
;
const Me = (e144, t80, r57, n49)=>{
    let a32 = {
        id: se(),
        type: e144,
        data: t80
    };
    return r57 && (a32.order = {
        priority: r57
    }, n49 && (a32.order.barrierID = ++je)), a32;
};
let je = 0, Ae = ({ from: e145 = "store" , store: t81 , target: r58 , to: n50 = r58 ? "store" : z , batch: a33 , priority: o20  })=>Me('mov', {
        from: e145,
        store: t81,
        to: n50,
        target: r58
    }, o20, a33)
, Ie = ({ fn: e146 , batch: t82 , priority: r59 , safe: n51 = 0 , filter: a34 = 0 , pure: o21 = 0  })=>Me('compute', {
        fn: e146,
        safe: n51,
        filter: a34,
        pure: o21
    }, r59, t82)
, qe = ({ fn: e147  })=>Ie({
        fn: e147,
        priority: "effect"
    })
, Ne = (e148, t83, r60)=>Ie({
        fn: e148,
        safe: 1,
        filter: t83,
        priority: r60 && "effect"
    })
, Oe = (e149, t84, r61)=>Ae({
        store: e149,
        to: t84 ? z : "a",
        priority: r61 && "sampler",
        batch: 1
    })
, Fe = (e150 = Ce, t85)=>Ie({
        fn: e150,
        pure: 1,
        filter: t85
    })
, Re = (e152)=>({
        id: se(),
        current: e152
    })
, ze = ({ current: e153  })=>e153
, _e = (e154, t87)=>{
    e154.before || (e154.before = []), G(e154.before, t87);
}, Pe = null;
const Ve = (e155, t88)=>{
    if (!e155) return t88;
    if (!t88) return e155;
    let r62;
    return (e155.v.type === t88.v.type && e155.v.id > t88.v.id || He(e155.v.type) > He(t88.v.type)) && (r62 = e155, e155 = t88, t88 = r62), r62 = Ve(e155.r, t88), e155.r = e155.l, e155.l = r62, e155;
}, Ee = [];
let Be = 0;
for(; Be < 6;)G(Ee, {
    first: null,
    last: null,
    size: 0
}), Be += 1;
const Le = ()=>{
    for(let e156 = 0; e156 < 6; e156++){
        let t89 = Ee[e156];
        if (t89.size > 0) {
            if (3 === e156 || 4 === e156) {
                t89.size -= 1;
                let e157 = Pe.v;
                return Pe = Ve(Pe.l, Pe.r), e157;
            }
            1 === t89.size && (t89.last = null);
            let r63 = t89.first;
            return t89.first = r63.r, t89.size -= 1, r63.v;
        }
    }
}, Te = (e158, t90, r64, n52, a35, o22)=>We(0, {
        a: null,
        b: null,
        node: r64,
        parent: n52,
        value: a35,
        page: t90,
        scope: o22
    }, e158)
, We = (e159, t91, r65, n53 = 0)=>{
    let a36 = He(r65), o23 = Ee[a36], l19 = {
        v: {
            idx: e159,
            stack: t91,
            type: r65,
            id: n53
        },
        l: null,
        r: null
    };
    3 === a36 || 4 === a36 ? Pe = Ve(Pe, l19) : (0 === o23.size ? o23.first = l19 : o23.last.r = l19, o23.last = l19), o23.size += 1;
}, He = (e160)=>{
    switch(e160){
        case 'child':
            return 0;
        case 'pure':
            return 1;
        case 'read':
            return 2;
        case "barrier":
            return 3;
        case "sampler":
            return 4;
        case "effect":
            return 5;
        default:
            return -1;
    }
}, Ue = new Set;
let Ge, Je = 1, Ke = 0, Qe = 0, Xe = null, Ye = (e161)=>{
    Ge = e161;
}, Ze = (e162)=>{
    Xe = e162;
};
const et = (e163, t92)=>{
    if (e163) {
        for(; e163 && !e163.reg[t92];)e163 = te(e163);
        if (e163) return e163;
    }
    return null;
};
let tt = (e164, t93, r, n54, a37)=>{
    let o24 = et(e164, n54.id);
    return o24 ? o24.reg[n54.id] : t93 ? (rt(t93, n54, a37), t93.reg[n54.id]) : n54;
}, rt = (e165, r66, n55, a38, o25)=>{
    let l20 = e165.reg, i15 = r66.sid;
    if (l20[r66.id]) return;
    let s12 = {
        id: r66.id,
        current: r66.current
    };
    if (i15 && i15 in e165.sidValuesMap && !(i15 in e165.sidIdMap)) s12.current = e165.sidValuesMap[i15];
    else if (r66.before && !o25) {
        let o26 = 0, i16 = n55 || !r66.noInit || a38;
        t(r66.before, (t94)=>{
            switch(t94.type){
                case R:
                    {
                        let r67 = t94.from;
                        if (r67 || t94.fn) {
                            r67 && rt(e165, r67, n55, a38);
                            let o28 = r67 && l20[r67.id].current;
                            i16 && (s12.current = t94.fn ? t94.fn(o28) : o28);
                        }
                        break;
                    }
                case 'field':
                    o26 || (o26 = 1, s12.current = Array.isArray(s12.current) ? [
                        ...s12.current
                    ] : {
                        ...s12.current
                    }), rt(e165, t94.from, n55, a38), i16 && (s12.current[t94.field] = l20[l20[t94.from.id].id].current);
            }
        });
    }
    i15 && (e165.sidIdMap[i15] = r66.id), l20[r66.id] = s12;
};
const nt = (e166, t95, r68)=>{
    try {
        return t95(Z(r68), e166.scope, r68);
    } catch (t96) {
        console.error(t96), e166.fail = 1;
    }
};
let at = (t97, r69 = {})=>(he(t97) && (at(t97.or, r69), e(t97, (e167, t98)=>{
        be(e167) || 'or' === t98 || 'and' === t98 || (r69[t98] = e167);
    }), at(t97.and, r69)), r69)
;
const ot = (e168, t99)=>{
    U(e168.next, t99), U(Q(e168), t99), U(X(e168), t99);
}, lt = (e169, t100, r70)=>{
    let n56;
    e169.next.length = 0, e169.seq.length = 0, e169.scope = null;
    let a39 = X(e169);
    for(; n56 = a39.pop();)ot(n56, e169), (t100 || r70 && 'sample' !== ne(e169, 'op') || "crosslink" === n56.family.type) && lt(n56, t100, 'on' !== ne(n56, 'op') && r70);
    for(a39 = Q(e169); n56 = a39.pop();)ot(n56, e169), r70 && "crosslink" === n56.family.type && lt(n56, t100, 'on' !== ne(n56, 'op') && r70);
}, st = (e170)=>e170.clear()
;
let ft = (e171, { deep: t102  } = {})=>{
    let r71 = 0;
    if (e171.ownerSet && e171.ownerSet.delete(e171), V(e171)) st(ee(e171));
    else if (L(e171)) {
        r71 = 1;
        let t101 = e171.history;
        st(t101.events), st(t101.effects), st(t101.stores), st(t101.domains);
    }
    lt(K(e171), !!t102, r71);
}, ut = (e172)=>{
    let t103 = ()=>ft(e172)
    ;
    return t103.unsubscribe = t103, t103;
}, ct = (e173, t104, r72, n57, o29)=>a({
        node: r72,
        parent: e173,
        child: t104,
        scope: {
            fn: o29
        },
        meta: {
            op: n57
        },
        family: {
            owners: [
                e173,
                t104
            ],
            links: t104
        },
        regional: 1
    })
, pt = (e175, t106)=>(r(ye(t106), '.watch argument should be a function'), ut(a({
        scope: {
            fn: t106
        },
        node: [
            qe({
                fn: Ce
            })
        ],
        parent: e175,
        meta: {
            op: 'watch'
        },
        family: {
            owners: e175
        },
        regional: 1
    })))
, mt = (e176, t107, r74 = "event")=>{
    te(e176) && te(e176).hooks[r74](t107);
}, gt = (e177, t108, r75, n59)=>{
    let a40 = "domain" === e177, o31 = ie(), l21 = at({
        or: n59,
        and: 'string' == typeof r75 ? {
            name: r75
        } : r75
    }), { parent: i17 = null , sid: f8 = null , named: u10 = null  } = l21, c6 = u10 || l21.name || (a40 ? '' : o31), d6 = s(c6, i17), p7 = {
        op: t108.kind = e177,
        name: t108.shortName = c6,
        sid: t108.sid = de(f8),
        named: u10,
        unitId: t108.id = o31,
        serialize: l21.serialize,
        derived: l21.derived,
        config: l21
    };
    if (t108.parent = i17, t108.compositeName = d6, t108.defaultConfig = l21, t108.thru = (e178)=>(J(0, 'thru', 'js pipe'), e178(t108))
    , t108.getType = ()=>d6.fullName
    , !a40) {
        t108.subscribe = (e181)=>(ve(e181), t108.watch(ye(e181) ? e181 : (t109)=>e181.next && e181.next(t109)
            ))
        , t108[D] = ()=>t108
        ;
        let e179 = ce();
        e179 && (p7.nativeTemplate = e179);
    }
    return p7;
}, ht = (e182)=>c({
        named: e182
    })
;
const yt = (e183, t110, r76, n60)=>{
    let a41;
    he(r76) && (a41 = r76, r76 = r76.fn);
    let o32 = c({
        name: `${e183.shortName} \u2192 *`,
        derived: 1,
        and: a41
    });
    return ct(e183, o32, n60, t110, r76), o32;
}, bt = (e184, t111, r77, n61, a42)=>{
    let o33 = Y(t111), l22 = Ae({
        store: o33,
        to: "a",
        priority: 'read'
    });
    r77 === R && (l22.data.softRead = 1);
    let i18 = [
        l22,
        Fe(n61)
    ];
    return u('storeOnMap', o33, i18, V(e184) && Y(e184)), ct(e184, t111, i18, r77, a42);
};
let kt = (e190, t115, r80)=>{
    try {
        return [
            1,
            e190(...r80)
        ];
    } catch (e191) {
        return t115(e191), [
            0,
            null
        ];
    }
}, wt = (e192, t116, r81, n64, a45)=>(l23)=>o({
            target: [
                n64,
                xt
            ],
            params: [
                r81 ? {
                    status: 'done',
                    params: e192,
                    result: l23
                } : {
                    status: 'fail',
                    params: e192,
                    error: l23
                },
                {
                    value: l23,
                    fn: r81 ? t116.rs : t116.rj
                }
            ],
            defer: 1,
            page: a45.page,
            scope: re(a45)
        })
;
const xt = a({
    node: [
        qe({
            fn: ({ fn: e193 , value: t117  })=>e193(t117)
        })
    ],
    meta: {
        op: 'fx',
        fx: 'sidechain'
    }
});
function esTunnel(options) {
    const { constructEventSource , domain =v("esTunnel") , maxReconnectAttempts =30 , millisecsBetweenReconnectAttempts =1000 ,  } = options;
    let eventSource = undefined;
    const connect = domain.createEvent("connect");
    const connected = domain.createEvent("connected");
    const reconnect = domain.createEvent("reconnect");
    const abort = domain.createEvent("abort");
    const $status = domain.createStore("initial").on(connect, (_, payload)=>`connecting ${payload.attempt ?? 1}/${maxReconnectAttempts}`
    ).on(connected, ()=>"connected"
    ).on(reconnect, (_, payload)=>`connecting ${payload.attempt}/${maxReconnectAttempts}`
    ).on(abort, ()=>`aborted after ${maxReconnectAttempts} tries`
    );
    connect.watch(({ validateURL , esURL , attempt =0  })=>{
        if (eventSource) eventSource.close();
        if (attempt > maxReconnectAttempts) {
            abort({
                validateURL,
                esURL,
                attempt,
                why: "max-reconnect-attempts-exceeded"
            });
            return;
        }
        fetch(validateURL).then((resp)=>{
            if (resp.ok) {
                eventSource = constructEventSource(esURL);
                eventSource.onopen = (esOnOpenEvent)=>connected({
                        esOnOpenEvent,
                        eventSource,
                        esURL,
                        validateURL,
                        attempt
                    })
                ;
                eventSource.onerror = (esOnErrorEvent)=>reconnect({
                        attempt,
                        esOnErrorEvent,
                        esURL,
                        validateURL,
                        why: "event-source-error"
                    })
                ;
            } else {
                reconnect({
                    attempt,
                    esURL,
                    validateURL,
                    why: "fetch-resp-not-ok",
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                });
            }
        }).catch((fetchError)=>reconnect({
                attempt,
                fetchError,
                esURL,
                validateURL,
                why: "fetch-failed"
            })
        );
    });
    reconnect.watch((payload)=>{
        setTimeout(()=>connect({
                validateURL: payload.validateURL,
                esURL: payload.esURL,
                attempt: payload.attempt + 1
            })
        , millisecsBetweenReconnectAttempts);
    });
    return {
        connect,
        connected,
        reconnect,
        abort,
        $status
    };
}
function wsTunnel(options) {
    const { constructWebSocket , domain =v("wsTunnel") , maxReconnectAttempts =30 , millisecsBetweenReconnectAttempts =1000 , allowClose =false ,  } = options;
    let webSocket = undefined;
    const connect = domain.createEvent("connect");
    const connected = domain.createEvent("connected");
    const reconnect = domain.createEvent("reconnect");
    const abort = domain.createEvent("abort");
    const $status = domain.createStore("initial").on(connect, (_, payload)=>`connecting ${payload.attempt ?? 1}/${maxReconnectAttempts}`
    ).on(connected, ()=>"connected"
    ).on(reconnect, (_, payload)=>`connecting ${payload.attempt}/${maxReconnectAttempts}`
    ).on(abort, ()=>`aborted after ${maxReconnectAttempts} tries`
    );
    connect.watch(({ validateURL , wsURL , attempt =0  })=>{
        if (webSocket) webSocket.close();
        if (attempt > maxReconnectAttempts) {
            abort({
                validateURL,
                wsURL,
                attempt,
                why: "max-reconnect-attempts-exceeded"
            });
            return;
        }
        fetch(validateURL).then((resp)=>{
            if (resp.ok) {
                webSocket = constructWebSocket(wsURL);
                webSocket.onopen = (wsOnOpenEvent)=>connected({
                        wsOnOpenEvent,
                        webSocket,
                        wsURL,
                        validateURL,
                        attempt
                    })
                ;
                webSocket.onclose = (wsOnCloseEvent)=>{
                    if (!allowClose) {
                        reconnect({
                            attempt,
                            wsOnCloseEvent,
                            wsURL,
                            validateURL,
                            why: "web-socket-close-not-allowed"
                        });
                    }
                };
                webSocket.onerror = (wsOnErrorEvent)=>reconnect({
                        attempt,
                        wsOnErrorEvent,
                        wsURL,
                        validateURL,
                        why: "web-socket-error"
                    })
                ;
            } else {
                reconnect({
                    attempt,
                    wsURL,
                    validateURL,
                    why: "fetch-resp-not-ok",
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                });
            }
        }).catch((fetchError)=>reconnect({
                attempt,
                fetchError,
                wsURL,
                validateURL,
                why: "fetch-failed"
            })
        );
    });
    reconnect.watch((payload)=>{
        setTimeout(()=>connect({
                validateURL: payload.validateURL,
                wsURL: payload.wsURL,
                attempt: payload.attempt + 1
            })
        , millisecsBetweenReconnectAttempts);
    });
    return {
        connect,
        connected,
        reconnect,
        abort,
        $status
    };
}
export { esTunnel as esTunnel };
export { wsTunnel as wsTunnel };
