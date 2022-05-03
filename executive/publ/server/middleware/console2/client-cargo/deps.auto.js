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
function n(e4, t4) {
    de = {
        parent: de,
        value: e4,
        template: oe(e4, 'template') || pe(),
        sidRoot: oe(e4, 'sidRoot') || de && de.sidRoot
    };
    try {
        return t4();
    } finally{
        de = ne(de);
    }
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
function i(t11, r5 = "combine") {
    let n5 = r5 + '(', a6 = '', o5 = 0;
    return e(t11, (e16)=>{
        o5 < 25 && (null != e16 && (n5 += a6, n5 += E(e16) ? le(e16).fullName : e16.toString()), o5 += 1, a6 = ', ');
    }), n5 + ')';
}
function l(e17, t12) {
    e17.shortName = t12, Object.assign(le(e17), s(t12, ne(e17)));
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
function f(e19, t14) {
    let r7 = t14 ? e19 : e19[0];
    we(r7);
    let n7 = r7.or, a9 = r7.and;
    if (a9) {
        let r8 = t14 ? a9 : a9[0];
        if (be(r8) && 'and' in r8) {
            let r9 = f(a9, t14);
            e19 = r9[0], n7 = {
                ...n7,
                ...r9[1]
            };
        } else e19 = a9;
    }
    return [
        e19,
        n7
    ];
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
function p(...e44) {
    let t26, n14, a12;
    [e44, a12] = f(e44);
    let o8, i7, l5, s4 = e44[e44.length - 1];
    if (ve(s4) ? (n14 = e44.slice(0, -1), t26 = s4) : n14 = e44, 1 === n14.length) {
        let e45 = n14[0];
        L(e45) || (o8 = e45, i7 = 1);
    }
    if (!i7 && (o8 = n14, t26)) {
        l5 = 1;
        let e46 = t26;
        t26 = (t27)=>e46(...t27)
        ;
    }
    return r(be(o8), 'shape should be an object'), kt(Array.isArray(o8), !l5, o8, a12, t26);
}
function m(...e47) {
    return Q(0, 'createStoreObject', 'combine'), p(...e47);
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
function y(e65) {
    let t36;
    [e65, t36] = f(e65, 1);
    let { source: r24 , effect: n19 , mapParams: a14  } = e65, i10 = h(e65, t36);
    ie(i10, 'attached', 1);
    let l7, { runner: u6  } = X(i10).scope, c3 = Oe((e66, t, n20)=>{
        let l8, { params: s7 , req: f6 , handler: u7  } = e66, c4 = i10.finally, d4 = St(s7, f6, 0, c4, n20), p5 = n20.a, m4 = B(u7), g3 = 1;
        if (a14 ? [g3, l8] = wt(a14, d4, [
            s7,
            p5
        ]) : l8 = r24 && m4 ? p5 : s7, g3) {
            if (!m4) return e66.args = [
                p5,
                l8
            ], 1;
            o({
                target: u7,
                params: {
                    params: l8,
                    req: {
                        rs: St(s7, f6, 1, c4, n20),
                        rj: d4
                    }
                },
                page: n20.page,
                defer: 1
            });
        }
    }, 1, 1);
    if (r24) {
        let e67;
        L(r24) ? (e67 = r24, he(e67, [
            i10
        ])) : (e67 = p(r24), he(i10, [
            e67
        ])), l7 = [
            Fe(ee(e67)),
            c3
        ];
    } else l7 = [
        c3
    ];
    u6.seq.splice(1, 0, ...l7), i10.use(n19);
    let d3 = ne(n19);
    return d3 && (Object.assign(le(i10), s(i10.shortName, d3)), i10.defaultConfig.parent = d3), ht(n19, i10, "effect"), i10;
}
function b(...t37) {
    let [[r25, n21], a15] = f(t37), o10 = {};
    return e(n21, (e68, t38)=>{
        let n22 = o10[t38] = c(t38, {
            parent: ne(r25),
            config: a15
        });
        r25.on(n22, e68), ht(r25, n22);
    }), o10;
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
function k(e75) {
    we(e75);
    let t41 = R in e75 ? e75[R]() : e75;
    r(t41.subscribe, 'expect observable to have .subscribe');
    let n25 = c(), a17 = dt(n25);
    return t41.subscribe({
        next: n25,
        error: a17,
        complete: a17
    }), n25;
}
function w(e76, t42) {
    xe(e76, 'merge', 'first argument');
    let r30 = c({
        name: i(e76, 'merge'),
        derived: 1,
        and: t42
    });
    return pt(e76, r30, [], 'merge'), r30;
}
function S(e77, n26) {
    let a18 = 0;
    return t(Ct, (t43)=>{
        t43 in e77 && (r(null != e77[t43], $t(n26, t43)), a18 = 1);
    }), a18;
}
function x(...e78) {
    let t44, r31, n27, a19, [[o11, i13, l10], s9] = f(e78), u8 = 1;
    return ke(i13) && be(o11) && S(o11, "sample") && (i13 = o11.clock, l10 = o11.fn, u8 = !o11.greedy, a19 = o11.filter, t44 = o11.target, r31 = o11.name, n27 = o11.sid, o11 = o11.source), jt("sample", i13, o11, a19, t44, l10, r31, s9, u8, 1, 0, n27);
}
function C(...e79) {
    let [[t45, r32], n28] = f(e79);
    return r32 || (r32 = t45, t45 = r32.source), S(r32, 'guard'), jt('guard', r32.clock, t45, r32.filter, r32.target, null, r32.name, n28, !r32.greedy, 0, 1);
}
function $(t46, r33, n29) {
    if (L(t46)) return Q(0, 'restore($store)'), t46;
    if (T(t46) || B(t46)) {
        let e80 = ne(t46), a20 = d(r33, {
            parent: e80,
            name: t46.shortName,
            and: n29
        });
        return pt(B(t46) ? t46.doneData : t46, a20), e80 && e80.hooks.store(a20), a20;
    }
    let a21 = Array.isArray(t46) ? [] : {};
    return e(t46, (e81, t47)=>a21[t47] = L(e81) ? e81 : d(e81, {
            name: t47
        })
    ), a21;
}
function j(...t48) {
    let n30, o12, i14 = 'split', [[l11, s10], d5] = f(t48), p6 = !s10;
    p6 && (n30 = l11.cases, s10 = l11.match, o12 = l11.clock, l11 = l11.source);
    let m5 = L(s10), g4 = !E(s10) && ve(s10), h4 = !m5 && !g4 && be(s10);
    n30 || (n30 = {}), p6 ? e(n30, (e82, t49)=>Ce(i14, e82, `cases.${t49}`)
    ) : (r(h4, 'match should be an object'), e(s10, (e, t50)=>n30[t50] = c({
            derived: 1,
            and: d5
        })
    ), n30.__ = c({
        derived: 1,
        and: d5
    }));
    let y3, b1 = new Set([].concat(l11, o12 || [], Object.values(n30))), v1 = Object.keys(m5 || g4 ? n30 : s10);
    if (m5 || g4) m5 && b1.add(s10), y3 = [
        m5 && Fe(ee(s10), 0, 1),
        Ne({
            safe: m5,
            filter: 1,
            pure: !m5,
            fn (e83, t51, r34) {
                let n31 = String(m5 ? r34.a : s10(e83));
                It(t51, G(v1, n31) ? n31 : '__', e83, r34);
            }
        })
    ];
    else if (h4) {
        let t52 = Pe({});
        t52.type = 'shape';
        let r35, n32 = [];
        e(s10, (e84, a22)=>{
            if (E(e84)) {
                r35 = 1, K(n32, a22), b1.add(e84);
                let o13 = pt(e84, [], [
                    Fe(t52),
                    Oe((e85, t, { a: r36  })=>r36[a22] = e85
                    )
                ]);
                if (L(e84)) {
                    t52.current[a22] = e84.getState();
                    let r37 = ee(e84);
                    Ee(t52, {
                        from: r37,
                        field: a22,
                        type: 'field'
                    }), u('splitMatchStore', r37, o13);
                }
            }
        }), r35 && u('splitBase', t52), y3 = [
            r35 && Fe(t52, 0, 1),
            De((e86, t53, r38)=>{
                for(let a23 = 0; a23 < v1.length; a23++){
                    let o14 = v1[a23];
                    if (G(n32, o14) ? r38.a[o14] : s10[o14](e86)) return void It(t53, o14, e86, r38);
                }
                It(t53, '__', e86, r38);
            }, 1)
        ];
    } else r(0, 'expect match to be unit, function or object');
    let k1 = a({
        meta: {
            op: i14
        },
        parent: o12 ? [] : l11,
        scope: n30,
        node: y3,
        family: {
            owners: Array.from(b1)
        },
        regional: 1
    });
    if (o12 && jt(i14, o12, l11, null, k1, null, i14, d5, 0, 0, 0), !p6) return n30;
}
function M(e87, { scope: t54 , params: r39  }) {
    if (!E(e87)) return Promise.reject(new Error('first argument should be unit'));
    if (!B(e87) && !T(e87) && !L(e87)) return Promise.reject(new Error('first argument accepts only effects, events and stores'));
    let n33 = g();
    n33.parentFork = Ke;
    let { fxCount: a24  } = t54;
    K(a24.scope.defers, n33);
    let i15 = [
        e87
    ], l12 = [];
    return K(l12, B(e87) ? {
        params: r39,
        req: {
            rs (e88) {
                n33.value = {
                    status: 'done',
                    value: e88
                };
            },
            rj (e89) {
                n33.value = {
                    status: 'fail',
                    value: e89
                };
            }
        }
    } : r39), K(i15, a24), K(l12, null), o({
        target: i15,
        params: l12,
        scope: t54
    }), n33.req;
}
function A(e90, r40) {
    let n34 = [];
    (function e91(a25) {
        G(n34, a25) || (K(n34, a25), "store" === oe(a25, 'op') && oe(a25, 'sid') && r40(a25, oe(a25, 'sid')), t(a25.next, e91), t(Y(a25), e91), t(Z(a25), e91));
    })(e90);
}
function I(e92, n35) {
    if (Array.isArray(e92) && (e92 = new Map(e92)), e92 instanceof Map) {
        let a26 = {};
        return t(e92, (e93, t55)=>{
            r(E(t55), 'Map key should be a unit'), n35 && n35(t55, e93), r(t55.sid, 'unit should have a sid'), r(!(t55.sid in a26), 'duplicate sid found'), a26[t55.sid] = e93;
        }), a26;
    }
    return e92;
}
function q(e94, n36) {
    let o15, i16 = e94;
    W(e94) && (o15 = e94, i16 = n36);
    let l13 = ((e95)=>{
        let r41 = a({
            scope: {
                defers: [],
                inFlight: 0,
                fxID: 0
            },
            node: [
                Oe((e, t56, r42)=>{
                    ne(r42) ? 'dec' === oe(ne(r42).node, 'needFxCounter') ? t56.inFlight -= 1 : (t56.inFlight += 1, t56.fxID += 1) : t56.fxID += 1;
                }),
                Ne({
                    priority: "sampler",
                    batch: 1
                }),
                Oe((e96, r43)=>{
                    let { defers: n38 , fxID: a27  } = r43;
                    r43.inFlight > 0 || 0 === n38.length || Promise.resolve().then(()=>{
                        r43.fxID === a27 && t(n38.splice(0, n38.length), (e97)=>{
                            et(e97.parentFork), e97.rs(e97.value);
                        });
                    });
                }, 0, 1)
            ]
        }), n37 = a({
            node: [
                Oe((e98, t, r44)=>{
                    let n39 = ne(r44);
                    if (n39) {
                        let t57 = n39.node;
                        if (!oe(t57, 'isCombine') || ne(n39) && 'combine' !== oe(ne(n39).node, 'op')) {
                            let n40 = ae(r44), a28 = t57.scope.state.id, o17 = oe(t57, 'sid');
                            n40.sidIdMap[o17] = a28, n40.sidValuesMap[o17] = e98;
                        }
                    }
                })
            ]
        }), o16 = a({
            node: [
                Oe((e, t, r45)=>{
                    let n41 = ae(r45);
                    if (n41) {
                        let e99 = ne(r45);
                        e99 && (!oe(e99.node, 'isCombine') || ne(e99) && 'combine' !== oe(ne(e99).node, 'op')) && (n41.warnSerialize = 1);
                    }
                })
            ]
        }), i17 = {
            cloneOf: e95,
            reg: {},
            sidValuesMap: {},
            sidIdMap: {},
            getState (e100) {
                if ('current' in e100) return nt(Ze, i17, null, e100).current;
                let t58 = X(e100);
                return nt(Ze, i17, t58, t58.scope.state, 1).current;
            },
            kind: "scope",
            graphite: a({
                family: {
                    type: "domain",
                    links: [
                        r41,
                        n37,
                        o16
                    ]
                },
                meta: {
                    unit: 'fork'
                },
                scope: {
                    forkInFlightCounter: r41
                }
            }),
            additionalLinks: {},
            handlers: {},
            fxCount: r41,
            storeChange: n37,
            warnSerializeNode: o16
        };
        return i17;
    })(o15);
    if (i16) {
        if (i16.values) {
            let e101 = I(i16.values, (e104)=>r(L(e104), 'Values map can contain only stores as keys')
            );
            Object.assign(l13.sidValuesMap, e101);
        }
        i16.handlers && (l13.handlers = I(i16.handlers, (e105)=>r(B(e105), "Handlers map can contain only effects as keys")
        ));
    }
    return l13;
}
function N(e106, { values: t59  }) {
    r(be(t59), 'values property should be an object');
    let n42, a29, i18, l14 = I(t59), s11 = Object.getOwnPropertyNames(l14), f7 = [], u9 = [];
    H(e106) ? (n42 = e106, i18 = 1, r(n42.cloneOf, 'scope should be created from domain'), a29 = X(n42.cloneOf)) : W(e106) ? a29 = X(e106) : r(0, 'first argument of hydrate should be domain or scope'), A(a29, (e107, t60)=>{
        G(s11, t60) && (K(f7, e107), K(u9, l14[t60]));
    }), o({
        target: f7,
        params: u9,
        scope: n42
    }), i18 && Object.assign(n42.sidValuesMap, l14);
}
function z(e108, { scope: t61  } = {}) {
    r(t61 || Ke, 'scopeBind cannot be called outside of forked .watch');
    let n43 = t61 || Ke;
    return B(e108) ? (t62)=>{
        let r46 = g();
        return o({
            target: e108,
            params: {
                params: t62,
                req: r46
            },
            scope: n43
        }), r46.req;
    } : (t63)=>(o({
            target: e108,
            params: t63,
            scope: n43
        }), t63)
    ;
}
function O(t64, n44 = {}) {
    t64.warnSerialize && console.error('There is a store without sid in this scope, its value is omitted');
    let a30 = n44.ignore ? n44.ignore.map(({ sid: e109  })=>e109
    ) : [], o18 = {};
    return e(t64.sidValuesMap, (e110, r47)=>{
        if (G(a30, r47)) return;
        let n45 = t64.sidIdMap[r47];
        o18[r47] = n45 && n45 in t64.reg ? t64.reg[n45].current : e110;
    }), 'onlyChanges' in n44 && !n44.onlyChanges && (r(t64.cloneOf, 'scope should be created from domain'), A(X(t64.cloneOf), (e111, r48)=>{
        r48 in o18 || G(a30, r48) || oe(e111, 'isCombine') || 'ignore' === oe(e111, 'serialize') || (o18[r48] = t64.getState(e111));
    })), o18;
}
function F({ unit: e112 , fn: t65 , scope: r49  }) {
    let n46 = [
        Re.run({
            fn: (e113)=>t65(e113)
        })
    ];
    if (r49) {
        let t66 = a({
            node: n46
        }), o19 = e112.graphite.id, i19 = r49.additionalLinks, l15 = i19[o19] || [];
        return i19[o19] = l15, l15.push(t66), D(()=>{
            let e114 = l15.indexOf(t66);
            -1 !== e114 && l15.splice(e114, 1), ct(t66);
        });
    }
    {
        let t67 = a({
            node: n46,
            parent: [
                e112
            ],
            family: {
                owners: e112
            }
        });
        return D(()=>{
            ct(t67);
        });
    }
}
function D(e115) {
    let t68 = ()=>e115()
    ;
    return t68.unsubscribe = ()=>e115()
    , t68;
}
let R = 'undefined' != typeof Symbol && Symbol.observable || '@@observable', P = 'map', _ = 'stack', E = (e116)=>(ve(e116) || be(e116)) && 'kind' in e116
;
const V = (e117)=>(t69)=>E(t69) && t69.kind === e117
;
let L = V("store"), T = V("event"), B = V("effect"), W = V("domain"), H = V("scope");
var U = {
    __proto__: null,
    unit: E,
    store: L,
    event: T,
    effect: B,
    domain: W,
    scope: H
};
let G = (e118, t70)=>e118.includes(t70)
, J = (e119, t71)=>{
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
, ge = ({ sid: e135 , name: t76 , loc: r53 , method: o20 , fn: i20  })=>n(a({
        meta: {
            sidRoot: me(e135),
            name: t76,
            loc: r53,
            method: o20
        }
    }), i20)
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
}, Ce = (e146, r56, n50 = "target")=>t(ye(r56), (t80)=>Q(!oe(t80, 'derived'), `${e146}: derived unit in "${n50}"`, "createEvent/createStore")
    )
, $e = (e147, { fn: t81  }, { a: r57  })=>t81(e147, r57)
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
, Re = {
    mov: qe,
    compute: Ne,
    filter: ({ fn: e157 , pure: t90  })=>Ne({
            fn: e157,
            filter: 1,
            pure: t90
        })
    ,
    run: ze
}, Pe = (e158)=>({
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
, mt = (e180)=>{
    let t109 = 'forward', [{ from: r75 , to: n60  }, o31] = f(e180, 1);
    return xe(r75, t109, '"from"'), xe(n60, t109, '"to"'), Ce(t109, n60, 'to'), dt(a({
        parent: r75,
        child: n60,
        meta: {
            op: t109,
            config: o31
        },
        family: {},
        regional: 1
    }));
}, gt = (e181, t110)=>(r(ve(t110), '.watch argument should be a function'), dt(a({
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
}, kt = (t116, n64, a43, o35, l20)=>{
    let s13 = t116 ? (e190)=>e190.slice()
     : (e191)=>({
            ...e191
        })
    , f9 = t116 ? [] : {}, c6 = s13(f9), p8 = Pe(c6), m6 = Pe(1);
    p8.type = t116 ? 'list' : 'shape', p8.noInit = 1, u('combineBase', p8, m6);
    let g5 = d(c6, {
        name: i(a43),
        derived: 1,
        and: o35
    }), h5 = ee(g5);
    h5.noInit = 1, ie(g5, 'isCombine', 1);
    let y4 = Fe(p8);
    y4.order = {
        priority: 'barrier'
    };
    let b2 = [
        Oe((e192, t, r80)=>(r80.scope && !r80.scope.reg[p8.id] && (r80.c = 1), e192)
        ),
        y4,
        qe({
            store: m6,
            to: 'b'
        }),
        Oe((e193, { key: t117  }, r81)=>{
            if (r81.c || e193 !== r81.a[t117]) return n64 && r81.b && (r81.a = s13(r81.a)), r81.a[t117] = e193, 1;
        }, 1),
        qe({
            from: "a",
            target: p8
        }),
        qe({
            from: "value",
            store: 0,
            target: m6
        }),
        qe({
            from: "value",
            store: 1,
            target: m6,
            priority: "barrier",
            batch: 1
        }),
        Fe(p8, 1),
        l20 && De()
    ];
    return e(a43, (e194, t118)=>{
        if (!L(e194)) return r(!E(e194) && !ke(e194), `combine expects a store in a field ${t118}`), void (c6[t118] = f9[t118] = e194);
        f9[t118] = e194.defaultState, c6[t118] = e194.getState();
        let n65 = pt(e194, g5, b2, 'combine', l20);
        n65.scope.key = t118;
        let a44 = ee(e194);
        Ee(p8, {
            type: 'field',
            field: t118,
            from: a44
        }), u('combineField', a44, n65);
    }), g5.defaultShape = a43, Ee(h5, {
        type: P,
        from: p8,
        fn: l20
    }), pe() || (g5.defaultState = l20 ? h5.current = l20(c6) : f9), g5;
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
}), Ct = [
    'source',
    'clock',
    'target'
], $t = (e199, t122)=>e199 + `: ${t122} should be defined`
;
let jt = (e200, t123, n67, a46, o36, i26, l21, s14, f10, m7, g6, h6)=>{
    let y5 = !!o36;
    r(!ke(n67) || !ke(t123), $t(e200, 'either source or clock'));
    let b3 = 0;
    ke(n67) ? b3 = 1 : E(n67) || (n67 = p(n67)), ke(t123) ? t123 = n67 : (xe(t123, e200, 'clock'), Array.isArray(t123) && (t123 = w(t123))), b3 && (n67 = t123), s14 || l21 || (l21 = n67.shortName);
    let v2 = 'none';
    (g6 || a46) && (E(a46) ? v2 = 'unit' : (r(ve(a46), '`filter` should be function or unit'), v2 = 'fn')), o36 ? (xe(o36, e200, 'target'), Ce(e200, o36)) : 'none' === v2 && m7 && L(n67) && L(t123) ? o36 = d(i26 ? i26(_e(ee(n67)), _e(ee(t123))) : _e(ee(n67)), {
        name: l21,
        sid: h6,
        or: s14
    }) : (o36 = c({
        name: l21,
        derived: 1,
        or: s14
    }), u('sampleTarget', X(o36)));
    let k2 = Pe(), S1 = [];
    if ('unit' === v2) {
        let [r84, n68] = At(a46, o36, t123, k2, e200);
        S1 = [
            ...Mt(n68),
            ...Mt(r84)
        ];
    }
    let [x1, C1] = At(n67, o36, t123, k2, e200);
    return he(n67, [
        pt(t123, o36, [
            u('sampleSourceLoader'),
            qe({
                from: _,
                target: k2
            }),
            ...Mt(C1),
            Fe(x1, 1, f10),
            ...S1,
            Fe(k2),
            'fn' === v2 && De((e201, t, { a: r85  })=>a46(e201, r85)
            , 1),
            i26 && De($e),
            u('sampleSourceUpward', y5)
        ], e200, i26)
    ]), o36;
};
const Mt = (e202)=>[
        Fe(e202),
        Oe((e, t, { a: r86  })=>r86
        , 1)
    ]
, At = (e203, t124, r87, n69, o37)=>{
    let i27 = L(e203), l22 = i27 ? ee(e203) : Pe(), s15 = Pe(i27);
    return i27 || a({
        parent: e203,
        node: [
            qe({
                from: _,
                target: l22
            }),
            qe({
                from: "value",
                store: 1,
                target: s15
            })
        ],
        family: {
            owners: [
                e203,
                t124,
                r87
            ],
            links: t124
        },
        meta: {
            op: o37
        },
        regional: 1
    }), u('sampleSource', s15, l22, n69), [
        l22,
        s15
    ];
}, It = (e204, t125, r88, n70)=>{
    let a47 = e204[t125];
    a47 && o({
        target: a47,
        params: Array.isArray(a47) ? a47.map(()=>r88
        ) : r88,
        defer: 1,
        stack: n70
    });
}, qt = "22.3.0";
export { M as allSettled, y as attach, ct as clearNode, p as combine, b as createApi, v as createDomain, h as createEffect, c as createEvent, a as createNode, d as createStore, m as createStoreObject, F as createWatch, q as fork, mt as forward, k as fromObservable, C as guard, N as hydrate, U as is, o as launch, w as merge, $ as restore, x as sample, z as scopeBind, O as serialize, l as setStoreName, j as split, Re as step, qt as version, ge as withFactory, n as withRegion };
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
    let u11 = -1;
    const r89 = 10 ** dp;
    do {
        bytes /= thresh;
        ++u11;
    }while (Math.round(Math.abs(bytes) * r89) / r89 >= thresh && u11 < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u11];
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
const projectDomain = v("project");
const projectInitFx = projectDomain.createEffect(async ()=>(await fetch("/publication/inspect/project.json")).json()
);
const $project = projectDomain.createStore(null).on(projectInitFx.doneData, (_, project)=>project
);
export { projectDomain as projectDomain };
export { projectInitFx as projectInitFx };
export { $project as $project };
