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
function a({ node: e5 = [] , from: r2 , source: n1 , parent: a1 = r2 || n1 , to: o1 , target: i1 , child: l1 = o1 || i1 , scope: s1 = {} , meta: f1 = {} , family: u1 = {
    type: 'regular'
} , regional: c1  } = {}) {
    let d1 = ye(a1), p1 = ye(u1.links), m1 = ye(u1.owners), g1 = [];
    t(e5, (e6)=>e6 && K(g1, e6)
    );
    let h1 = {
        id: ce(),
        seq: g1,
        next: ye(l1),
        meta: f1,
        scope: s1,
        family: {
            type: u1.type || "crosslink",
            links: p1,
            owners: m1
        }
    };
    return t(p1, (e7)=>K(Y(e7), h1)
    ), t(m1, (e8)=>K(Z(e8), h1)
    ), t(d1, (e9)=>K(e9.next, h1)
    ), c1 && de && he(te(de), [
        h1
    ]), h1;
}
function o(e10, r3, n2) {
    let a2 = Ze, o2 = null, i2 = Ke;
    if (e10.target && (r3 = e10.params, n2 = e10.defer, a2 = 'page' in e10 ? e10.page : a2, e10.stack && (o2 = e10.stack), i2 = ae(e10) || i2, e10 = e10.target), i2 && Ke && i2 !== Ke && (Ke = null), Array.isArray(e10)) for(let t5 = 0; t5 < e10.length; t5++)He('pure', a2, X(e10[t5]), o2, r3[t5], i2);
    else He('pure', a2, X(e10), o2, r3, i2);
    if (n2 && !Qe) return;
    let l2, s2, f2, u2, c2, d2, p2 = {
        isRoot: Qe,
        currentPage: Ze,
        scope: Ke,
        isWatch: Xe,
        isPure: Ye
    };
    Qe = 0;
    e: for(; u2 = We();){
        let { idx: e11 , stack: r4 , type: n3  } = u2;
        f2 = r4.node, Ze = c2 = r4.page, Ke = ae(r4), c2 ? d2 = c2.reg : Ke && (d2 = Ke.reg);
        let a4 = !!c2, o4 = !!Ke, i4 = {
            fail: 0,
            scope: f2.scope
        };
        l2 = s2 = 0;
        for(let t6 = e11; t6 < f2.seq.length && !l2; t6++){
            let u3 = f2.seq[t6];
            if (u3.order) {
                let { priority: a3 , barrierID: o3  } = u3.order, i3 = o3 ? c2 ? `${c2.fullID}_${o3}` : o3 : 0;
                if (t6 !== e11 || n3 !== a3) {
                    o3 ? Je.has(i3) || (Je.add(i3), Ue(t6, r4, a3, o3)) : Ue(t6, r4, a3);
                    continue e;
                }
                o3 && Je.delete(i3);
            }
            switch(u3.type){
                case 'mov':
                    {
                        let e12, t7 = u3.data;
                        switch(t7.from){
                            case _:
                                e12 = te(r4);
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
                                    let e13 = rt(c2, t7.store.id);
                                    r4.page = c2 = e13, e13 ? d2 = e13.reg : o4 ? (at(Ke, t7.store, 0, 1, t7.softRead), d2 = Ke.reg) : d2 = void 0;
                                } else o4 && at(Ke, t7.store, 0, 1, t7.softRead);
                                e12 = _e(d2 && d2[t7.store.id] || t7.store);
                        }
                        switch(t7.to){
                            case _:
                                r4.value = e12;
                                break;
                            case "a":
                            case 'b':
                                r4[t7.to] = e12;
                                break;
                            case "store":
                                nt(c2, Ke, f2, t7.target).current = e12;
                        }
                        break;
                    }
                case 'compute':
                    let e14 = u3.data;
                    if (e14.fn) {
                        Xe = 'watch' === oe(f2, 'op'), Ye = e14.pure;
                        let t8 = e14.safe ? (0, e14.fn)(te(r4), i4.scope, r4) : ot(i4, e14.fn, r4);
                        e14.filter ? s2 = !t8 : r4.value = t8, Xe = p2.isWatch, Ye = p2.isPure;
                    }
            }
            l2 = i4.fail || s2;
        }
        if (!l2) {
            let e15 = te(r4);
            t(f2.next, (t9)=>{
                He('child', c2, t9, r4, e15, ae(r4));
            });
            let n4 = ae(r4);
            if (n4) {
                oe(f2, 'needFxCounter') && He('child', c2, n4.fxCount, r4, e15, n4), oe(f2, 'storeChange') && He('child', c2, n4.storeChange, r4, e15, n4), oe(f2, 'warnSerialize') && He('child', c2, n4.warnSerializeNode, r4, e15, n4);
                let a5 = n4.additionalLinks[f2.id];
                a5 && t(a5, (t10)=>{
                    He('child', c2, t10, r4, e15, n4);
                });
            }
        }
    }
    Qe = p2.isRoot, Ze = p2.currentPage, Ke = ae(p2);
}
function s(e18, t13) {
    let r6, n6, a8 = e18;
    if (t13) {
        let a7 = le(t13);
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
    let r10 = pe();
    if (r10) {
        let n8 = r10.handlers[e20];
        if (n8) return n8(r10, ...t15);
    }
}
function c(e21, t16) {
    let r11 = (e22, ...t17)=>(Q(!oe(r11, 'derived'), 'call of derived event', 'createEvent'), Q(!Ye, 'unit call from pure function', 'operators like sample'), Ze ? ((e23, t18, r12, n10)=>{
            let a10 = Ze, o6 = null;
            if (t18) for(o6 = Ze; o6 && o6.template !== t18;)o6 = ne(o6);
            tt(o6);
            let i5 = e23.create(r12, n10);
            return tt(a10), i5;
        })(r11, n9, e22, t17) : r11.create(e22, t17))
    , n9 = pe();
    return Object.assign(r11, {
        graphite: a({
            meta: yt("event", r11, e21, t16),
            regional: 1
        }),
        create: (e24)=>(o({
                target: r11,
                params: e24,
                scope: Ke
            }), e24)
        ,
        watch: (e25)=>gt(r11, e25)
        ,
        map: (e26)=>bt(r11, P, e26, [
                De()
            ])
        ,
        filter: (e27)=>bt(r11, "filter", e27.fn ? e27 : e27.fn, [
                De(Me, 1)
            ])
        ,
        filterMap: (e28)=>bt(r11, 'filterMap', e28, [
                De(),
                Oe((e29)=>!ke(e29)
                , 1)
            ])
        ,
        prepend (e30) {
            let t19 = c('* \u2192 ' + r11.shortName, {
                parent: ne(r11)
            });
            return u('eventPrepend', X(t19)), pt(t19, r11, [
                De()
            ], 'prepend', e30), ht(r11, t19), t19;
        }
    });
}
function d(e31, n11) {
    let i6 = Pe(e31), l3 = c({
        named: 'updates',
        derived: 1
    });
    u('storeBase', i6);
    let s3 = i6.id, f3 = {
        subscribers: new Map,
        updates: l3,
        defaultState: e31,
        stateRef: i6,
        getState () {
            let e32, t21 = i6;
            if (Ze) {
                let t20 = Ze;
                for(; t20 && !t20.reg[s3];)t20 = ne(t20);
                t20 && (e32 = t20);
            }
            return !e32 && Ke && (at(Ke, i6, 1), e32 = Ke), e32 && (t21 = e32.reg[s3]), _e(t21);
        },
        setState: (e33)=>o({
                target: f3,
                params: e33,
                defer: 1,
                scope: Ke
            })
        ,
        reset: (...e34)=>(t(e34, (e35)=>f3.on(e35, ()=>f3.defaultState
                )
            ), f3)
        ,
        on: (e36, r13)=>(xe(e36, '.on', 'first argument'), Q(!oe(f3, 'derived'), '.on in derived store', 'createStore'), t(Array.isArray(e36) ? e36 : [
                e36
            ], (e37)=>{
                f3.off(e37), re(f3).set(e37, dt(vt(e37, f3, 'on', je, r13)));
            }), f3)
        ,
        off (e38) {
            let t22 = re(f3).get(e38);
            return t22 && (t22(), re(f3).delete(e38)), f3;
        },
        map (e39, t23) {
            let r14, n12;
            be(e39) && (r14 = e39, e39 = e39.fn), Q(ke(t23), 'second argument of store.map', 'updateFilter');
            let a11 = f3.getState();
            pe() ? n12 = null : ke(a11) || (n12 = e39(a11, t23));
            let o7 = d(n12, {
                name: `${f3.shortName} \u2192 *`,
                derived: 1,
                and: r14
            }), l4 = vt(f3, o7, P, $e, e39);
            return Ee(ee(o7), {
                type: P,
                fn: e39,
                from: i6
            }), ee(o7).noInit = 1, u('storeMap', i6, l4), o7;
        },
        watch (e40, t24) {
            if (!t24 || !E(e40)) {
                let t25 = gt(f3, e40);
                return u('storeWatch', i6, e40) || e40(f3.getState()), t25;
            }
            return r(ve(t24), 'second argument should be a function'), e40.watch((e41)=>t24(f3.getState(), e41)
            );
        }
    }, p3 = yt("store", f3, n11), m2 = f3.defaultConfig.updateFilter;
    f3.graphite = a({
        scope: {
            state: i6,
            fn: m2
        },
        node: [
            Oe((e42, t, r15)=>(r15.scope && !r15.scope.reg[i6.id] && (r15.b = 1), e42)
            ),
            Fe(i6),
            Oe((e43, t, { a: r16 , b: n13  })=>!ke(e43) && (e43 !== r16 || n13)
            , 1),
            m2 && De($e, 1),
            qe({
                from: _,
                target: i6
            })
        ],
        child: l3,
        meta: p3,
        regional: 1
    });
    let g2 = oe(f3, 'derived'), h2 = 'ignore' === oe(f3, 'serialize'), y1 = oe(f3, 'sid');
    return y1 && (h2 || ie(f3, 'storeChange', 1), i6.sid = y1), y1 || h2 || g2 || ie(f3, 'warnSerialize', 1), r(g2 || !ke(e31), "current state can't be undefined, use null instead"), he(f3, [
        l3
    ]), f3;
}
function g() {
    let e48 = {};
    return e48.req = new Promise((t28, r17)=>{
        e48.rs = t28, e48.rj = r17;
    }), e48.req.catch(()=>{}), e48;
}
function h(e49, t29) {
    let n15 = c(ve(e49) ? {
        handler: e49
    } : e49, t29), i8 = X(n15);
    ie(i8, 'op', n15.kind = "effect"), n15.use = (e50)=>(r(ve(e50), '.use argument should be a function'), m3.scope.handler = e50, n15)
    , n15.use.getCurrent = ()=>m3.scope.handler
    ;
    let l6 = n15.finally = c({
        named: 'finally',
        derived: 1
    }), s5 = n15.done = l6.filterMap({
        named: 'done',
        fn ({ status: e51 , params: t30 , result: r18  }) {
            if ('done' === e51) return {
                params: t30,
                result: r18
            };
        }
    }), f4 = n15.fail = l6.filterMap({
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
            handlerId: oe(i8, 'sid'),
            handler: n15.defaultConfig.handler || (()=>r(0, `no handler used in ${n15.getType()}`)
            )
        },
        node: [
            Oe((e56, t32, r20)=>{
                let n16 = t32, a13 = n16.handler;
                if (ae(r20)) {
                    let e55 = ae(r20).handlers[n16.handlerId];
                    e55 && (a13 = e55);
                }
                return e56.handler = a13, e56;
            }, 0, 1),
            Oe(({ params: e57 , req: t33 , handler: r21 , args: n17 = [
                e57
            ]  }, a, o9)=>{
                let i9 = St(e57, t33, 1, l6, o9), s6 = St(e57, t33, 0, l6, o9), [f5, u5] = wt(r21, s6, n17);
                f5 && (be(u5) && ve(u5.then) ? u5.then(i9, s6) : i9(u5));
            }, 0, 1)
        ],
        meta: {
            op: 'fx',
            fx: 'runner'
        }
    });
    i8.scope.runner = m3, K(i8.seq, Oe((e58, { runner: t34  }, r22)=>{
        let n18 = ne(r22) ? {
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
            scope: ae(r22)
        }), n18.params;
    }, 0, 1)), n15.create = (e59)=>{
        let t35 = g(), r23 = {
            params: e59,
            req: t35
        };
        if (Ke) {
            if (!Xe) {
                let e60 = Ke;
                t35.req.finally(()=>{
                    et(e60);
                }).catch(()=>{});
            }
            o({
                target: n15,
                params: r23,
                scope: Ke
            });
        } else o(n15, r23);
        return t35.req;
    };
    let h3 = n15.inFlight = d(0, {
        serialize: 'ignore'
    }).on(n15, (e61)=>e61 + 1
    ).on(l6, (e62)=>e62 - 1
    ).map({
        fn: (e63)=>e63
        ,
        named: 'inFlight'
    });
    ie(l6, 'needFxCounter', 'dec'), ie(n15, 'needFxCounter', 1);
    let y2 = n15.pending = h3.map({
        fn: (e64)=>e64 > 0
        ,
        named: 'pending'
    });
    return he(n15, [
        l6,
        s5,
        f4,
        u4,
        p4,
        y2,
        h3
    ]), n15;
}
function v(r26, n23) {
    let i11 = a({
        family: {
            type: "domain"
        },
        regional: 1
    }), l9 = {
        history: {},
        graphite: i11,
        hooks: {}
    };
    i11.meta = yt("domain", l9, r26, n23), e({
        Event: c,
        Effect: h,
        Store: d,
        Domain: v
    }, (e69, r27)=>{
        let n24 = r27.toLowerCase(), a16 = c({
            named: `on${r27}`
        });
        l9.hooks[n24] = a16;
        let i12 = new Set;
        l9.history[`${n24}s`] = i12, a16.create = (e70)=>(o(a16, e70), e70)
        , K(X(a16).seq, Oe((e71, t, r28)=>(r28.scope = null, e71)
        )), a16.watch((e72)=>{
            he(l9, [
                e72
            ]), i12.add(e72), e72.ownerSet || (e72.ownerSet = i12), ne(e72) || (e72.parent = l9);
        }), he(l9, [
            a16
        ]), l9[`onCreate${r27}`] = (e73)=>(t(i12, e73), a16.watch(e73))
        , l9[`create${r27}`] = l9[n24] = (t39, r29)=>a16(e69(t39, {
                parent: l9,
                or: r29
            }))
        ;
    });
    let s8 = ne(l9);
    return s8 && e(l9.hooks, (e74, t40)=>pt(e74, s8.hooks[t40])
    ), l9;
}
let R = 'undefined' != typeof Symbol && Symbol.observable || '@@observable', P = 'map', _ = 'stack', E = (e116)=>(ve(e116) || be(e116)) && 'kind' in e116
;
const V = (e117)=>(t69)=>E(t69) && t69.kind === e117
;
let L = V("store"), T = V("event"), B = V("effect"), W = V("domain"), H = V("scope");
let J = (e119, t71)=>{
    let r50 = e119.indexOf(t71);
    -1 !== r50 && e119.splice(r50, 1);
}, K = (e120, t72)=>e120.push(t72)
, Q = (e121, t73, r51)=>!e121 && console.error(`${t73} is deprecated${r51 ? `, use ${r51} instead` : ''}`)
, X = (e122)=>e122.graphite || e122
, Y = (e123)=>e123.family.owners
, Z = (e124)=>e124.family.links
, ee = (e125)=>e125.stateRef
, te = (e126)=>e126.value
, re = (e127)=>e127.subscribers
, ne = (e128)=>e128.parent
, ae = (e129)=>e129.scope
, oe = (e130, t74)=>X(e130).meta[t74]
, ie = (e131, t75, r52)=>X(e131).meta[t75] = r52
, le = (e132)=>e132.compositeName
;
const se = ()=>{
    let e133 = 0;
    return ()=>"" + ++e133
    ;
};
let fe = se(), ue = se(), ce = se(), de = null, pe = ()=>de && de.template
, me = (e134)=>(e134 && de && de.sidRoot && (e134 = `${de.sidRoot}|${e134}`), e134)
, he = (e136, r54)=>{
    let n47 = X(e136);
    t(r54, (e137)=>{
        let t77 = X(e137);
        "domain" !== n47.family.type && (t77.family.type = "crosslink"), K(Y(t77), n47), K(Z(n47), t77);
    });
}, ye = (e138 = [])=>(Array.isArray(e138) ? e138 : [
        e138
    ]).flat().map(X)
, be = (e139)=>'object' == typeof e139 && null !== e139
, ve = (e140)=>'function' == typeof e140
, ke = (e141)=>void 0 === e141
, we = (e142)=>r(be(e142) || ve(e142), 'expect first argument be an object')
;
const Se = (e143, t78, n48, a31)=>r(!(!be(e143) && !ve(e143) || !('family' in e143) && !('graphite' in e143)), `${t78}: expect ${n48} to be a unit (store, event or effect)${a31}`)
;
let xe = (e144, r55, n49)=>{
    Array.isArray(e144) ? t(e144, (e145, t79)=>Se(e145, r55, `${t79} item of ${n49}`, '')
    ) : Se(e144, r55, n49, ' or array of units');
}, $e = (e147, { fn: t81  }, { a: r57  })=>t81(e147, r57)
, je = (e148, { fn: t82  }, { a: r58  })=>t82(r58, e148)
, Me = (e149, { fn: t83  })=>t83(e149)
;
const Ae = (e150, t84, r59, n51)=>{
    let a32 = {
        id: ue(),
        type: e150,
        data: t84
    };
    return r59 && (a32.order = {
        priority: r59
    }, n51 && (a32.order.barrierID = ++Ie)), a32;
};
let Ie = 0, qe = ({ from: e151 = "store" , store: t85 , target: r60 , to: n52 = r60 ? "store" : _ , batch: a33 , priority: o21  })=>Ae('mov', {
        from: e151,
        store: t85,
        to: n52,
        target: r60
    }, o21, a33)
, Ne = ({ fn: e152 , batch: t86 , priority: r61 , safe: n53 = 0 , filter: a34 = 0 , pure: o22 = 0  })=>Ae('compute', {
        fn: e152,
        safe: n53,
        filter: a34,
        pure: o22
    }, r61, t86)
, ze = ({ fn: e153  })=>Ne({
        fn: e153,
        priority: "effect"
    })
, Oe = (e154, t87, r62)=>Ne({
        fn: e154,
        safe: 1,
        filter: t87,
        priority: r62 && "effect"
    })
, Fe = (e155, t88, r63)=>qe({
        store: e155,
        to: t88 ? _ : "a",
        priority: r63 && "sampler",
        batch: 1
    })
, De = (e156 = Me, t89)=>Ne({
        fn: e156,
        pure: 1,
        filter: t89
    })
, Pe = (e158)=>({
        id: ue(),
        current: e158
    })
, _e = ({ current: e159  })=>e159
, Ee = (e160, t91)=>{
    e160.before || (e160.before = []), K(e160.before, t91);
}, Ve = null;
const Le = (e161, t92)=>{
    if (!e161) return t92;
    if (!t92) return e161;
    let r64;
    return (e161.v.type === t92.v.type && e161.v.id > t92.v.id || Ge(e161.v.type) > Ge(t92.v.type)) && (r64 = e161, e161 = t92, t92 = r64), r64 = Le(e161.r, t92), e161.r = e161.l, e161.l = r64, e161;
}, Te = [];
let Be = 0;
for(; Be < 6;)K(Te, {
    first: null,
    last: null,
    size: 0
}), Be += 1;
const We = ()=>{
    for(let e162 = 0; e162 < 6; e162++){
        let t93 = Te[e162];
        if (t93.size > 0) {
            if (3 === e162 || 4 === e162) {
                t93.size -= 1;
                let e163 = Ve.v;
                return Ve = Le(Ve.l, Ve.r), e163;
            }
            1 === t93.size && (t93.last = null);
            let r65 = t93.first;
            return t93.first = r65.r, t93.size -= 1, r65.v;
        }
    }
}, He = (e164, t94, r66, n54, a35, o23)=>Ue(0, {
        a: null,
        b: null,
        node: r66,
        parent: n54,
        value: a35,
        page: t94,
        scope: o23
    }, e164)
, Ue = (e165, t95, r67, n55 = 0)=>{
    let a36 = Ge(r67), o24 = Te[a36], i21 = {
        v: {
            idx: e165,
            stack: t95,
            type: r67,
            id: n55
        },
        l: null,
        r: null
    };
    3 === a36 || 4 === a36 ? Ve = Le(Ve, i21) : (0 === o24.size ? o24.first = i21 : o24.last.r = i21, o24.last = i21), o24.size += 1;
}, Ge = (e166)=>{
    switch(e166){
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
}, Je = new Set;
let Ke, Qe = 1, Xe = 0, Ye = 0, Ze = null, et = (e167)=>{
    Ke = e167;
}, tt = (e168)=>{
    Ze = e168;
};
const rt = (e169, t96)=>{
    if (e169) {
        for(; e169 && !e169.reg[t96];)e169 = ne(e169);
        if (e169) return e169;
    }
    return null;
};
let nt = (e170, t97, r, n56, a37)=>{
    let o25 = rt(e170, n56.id);
    return o25 ? o25.reg[n56.id] : t97 ? (at(t97, n56, a37), t97.reg[n56.id]) : n56;
}, at = (e171, r68, n57, a38, o26)=>{
    let i22 = e171.reg, l16 = r68.sid;
    if (i22[r68.id]) return;
    let s12 = {
        id: r68.id,
        current: r68.current
    };
    if (l16 && l16 in e171.sidValuesMap && !(l16 in e171.sidIdMap)) s12.current = e171.sidValuesMap[l16];
    else if (r68.before && !o26) {
        let o27 = 0, l17 = n57 || !r68.noInit || a38;
        t(r68.before, (t98)=>{
            switch(t98.type){
                case P:
                    {
                        let r69 = t98.from;
                        if (r69 || t98.fn) {
                            r69 && at(e171, r69, n57, a38);
                            let o29 = r69 && i22[r69.id].current;
                            l17 && (s12.current = t98.fn ? t98.fn(o29) : o29);
                        }
                        break;
                    }
                case 'field':
                    o27 || (o27 = 1, s12.current = Array.isArray(s12.current) ? [
                        ...s12.current
                    ] : {
                        ...s12.current
                    }), at(e171, t98.from, n57, a38), l17 && (s12.current[t98.field] = i22[i22[t98.from.id].id].current);
            }
        });
    }
    l16 && (e171.sidIdMap[l16] = r68.id), i22[r68.id] = s12;
};
const ot = (e172, t99, r70)=>{
    try {
        return t99(te(r70), e172.scope, r70);
    } catch (t100) {
        console.error(t100), e172.fail = 1;
    }
};
let lt = (t101, r71 = {})=>(be(t101) && (lt(t101.or, r71), e(t101, (e173, t102)=>{
        ke(e173) || 'or' === t102 || 'and' === t102 || (r71[t102] = e173);
    }), lt(t101.and, r71)), r71)
;
const st = (e174, t103)=>{
    J(e174.next, t103), J(Y(e174), t103), J(Z(e174), t103);
}, ft = (e175, t104, r72)=>{
    let n58;
    e175.next.length = 0, e175.seq.length = 0, e175.scope = null;
    let a39 = Z(e175);
    for(; n58 = a39.pop();)st(n58, e175), (t104 || r72 && 'sample' !== oe(e175, 'op') || "crosslink" === n58.family.type) && ft(n58, t104, 'on' !== oe(n58, 'op') && r72);
    for(a39 = Y(e175); n58 = a39.pop();)st(n58, e175), r72 && "crosslink" === n58.family.type && ft(n58, t104, 'on' !== oe(n58, 'op') && r72);
}, ut = (e176)=>e176.clear()
;
let ct = (e177, { deep: t106  } = {})=>{
    let r73 = 0;
    if (e177.ownerSet && e177.ownerSet.delete(e177), L(e177)) ut(re(e177));
    else if (W(e177)) {
        r73 = 1;
        let t105 = e177.history;
        ut(t105.events), ut(t105.effects), ut(t105.stores), ut(t105.domains);
    }
    ft(X(e177), !!t106, r73);
}, dt = (e178)=>{
    let t107 = ()=>ct(e178)
    ;
    return t107.unsubscribe = t107, t107;
}, pt = (e179, t108, r74, n59, o30)=>a({
        node: r74,
        parent: e179,
        child: t108,
        scope: {
            fn: o30
        },
        meta: {
            op: n59
        },
        family: {
            owners: [
                e179,
                t108
            ],
            links: t108
        },
        regional: 1
    })
, gt = (e181, t110)=>(r(ve(t110), '.watch argument should be a function'), dt(a({
        scope: {
            fn: t110
        },
        node: [
            ze({
                fn: Me
            })
        ],
        parent: e181,
        meta: {
            op: 'watch'
        },
        family: {
            owners: e181
        },
        regional: 1
    })))
, ht = (e182, t111, r76 = "event")=>{
    ne(e182) && ne(e182).hooks[r76](t111);
}, yt = (e183, t112, r77, n61)=>{
    let a40 = "domain" === e183, o32 = fe(), i23 = lt({
        or: n61,
        and: 'string' == typeof r77 ? {
            name: r77
        } : r77
    }), { parent: l18 = null , sid: f8 = null , named: u10 = null  } = i23, c5 = u10 || i23.name || (a40 ? '' : o32), d6 = s(c5, l18), p7 = {
        op: t112.kind = e183,
        name: t112.shortName = c5,
        sid: t112.sid = me(f8),
        named: u10,
        unitId: t112.id = o32,
        serialize: i23.serialize,
        derived: i23.derived,
        config: i23
    };
    if (t112.parent = l18, t112.compositeName = d6, t112.defaultConfig = i23, t112.thru = (e184)=>(Q(0, 'thru', 'js pipe'), e184(t112))
    , t112.getType = ()=>d6.fullName
    , !a40) {
        t112.subscribe = (e187)=>(we(e187), t112.watch(ve(e187) ? e187 : (t113)=>e187.next && e187.next(t113)
            ))
        , t112[R] = ()=>t112
        ;
        let e185 = pe();
        e185 && (p7.nativeTemplate = e185);
    }
    return p7;
};
const bt = (e188, t114, r78, n62)=>{
    let a41;
    be(r78) && (a41 = r78, r78 = r78.fn);
    let o33 = c({
        name: `${e188.shortName} \u2192 *`,
        derived: 1,
        and: a41
    });
    return pt(e188, o33, n62, t114, r78), o33;
}, vt = (e189, t115, r79, n63, a42)=>{
    let o34 = ee(t115), i24 = qe({
        store: o34,
        to: "a",
        priority: 'read'
    });
    r79 === P && (i24.data.softRead = 1);
    let l19 = [
        i24,
        De(n63)
    ];
    return u('storeOnMap', o34, l19, L(e189) && ee(e189)), pt(e189, t115, l19, r79, a42);
};
let wt = (e195, t119, r82)=>{
    try {
        return [
            1,
            e195(...r82)
        ];
    } catch (e196) {
        return t119(e196), [
            0,
            null
        ];
    }
}, St = (e197, t120, r83, n66, a45)=>(i25)=>o({
            target: [
                n66,
                xt
            ],
            params: [
                r83 ? {
                    status: 'done',
                    params: e197,
                    result: i25
                } : {
                    status: 'fail',
                    params: e197,
                    error: i25
                },
                {
                    value: i25,
                    fn: r83 ? t120.rs : t120.rj
                }
            ],
            defer: 1,
            page: a45.page,
            scope: ae(a45)
        })
;
const xt = a({
    node: [
        ze({
            fn: ({ fn: e198 , value: t121  })=>e198(t121)
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
