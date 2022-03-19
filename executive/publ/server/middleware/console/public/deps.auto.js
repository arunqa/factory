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
    ue = {
        parent: ue,
        value: e4,
        template: ne(e4, 'template') || ce(),
        sidRoot: ne(e4, 'sidRoot') || ue && ue.sidRoot
    };
    try {
        return t4();
    } finally{
        ue = te(ue);
    }
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
function l(t11, r5 = "combine") {
    let n5 = r5 + '(', a6 = '', o5 = 0;
    return e(t11, (e16)=>{
        o5 < 25 && (null != e16 && (n5 += a6, n5 += _(e16) ? oe(e16).fullName : e16.toString()), o5 += 1, a6 = ', ');
    }), n5 + ')';
}
function i(e17, t12) {
    e17.shortName = t12, Object.assign(oe(e17), s(t12, te(e17)));
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
function f(e19, t14) {
    let r7 = t14 ? e19 : e19[0];
    ve(r7);
    let n7 = r7.or, a9 = r7.and;
    if (a9) {
        let r8 = t14 ? a9 : a9[0];
        if (he(r8) && 'and' in r8) {
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
function p(...e44) {
    let t26, n14, a12;
    [e44, a12] = f(e44);
    let o8, l7, i5, s4 = e44[e44.length - 1];
    if (ye(s4) ? (n14 = e44.slice(0, -1), t26 = s4) : n14 = e44, 1 === n14.length) {
        let e45 = n14[0];
        V(e45) || (o8 = e45, l7 = 1);
    }
    if (!l7 && (o8 = n14, t26)) {
        i5 = 1;
        let e46 = t26;
        t26 = (t27)=>e46(...t27)
        ;
    }
    return r(he(o8), 'shape should be an object'), vt(Array.isArray(o8), !i5, o8, a12, t26);
}
function m(...e47) {
    return J(0, 'createStoreObject', 'combine'), p(...e47);
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
function y(e64) {
    let t36;
    [e64, t36] = f(e64, 1);
    let { source: r24 , effect: n19 , mapParams: a14  } = e64, l10 = h(e64, t36);
    ae(l10, 'attached', 1);
    let i7, { runner: u6  } = K(l10).scope, c4 = Ne((e65, t, n20)=>{
        let i8, { params: s7 , req: f6 , handler: u7  } = e65, c5 = l10.finally, d4 = wt(s7, f6, 0, c5, n20), p5 = n20.a, m4 = B(u7), g2 = 1;
        if (a14 ? [g2, i8] = kt(a14, d4, [
            s7,
            p5
        ]) : i8 = r24 && m4 ? p5 : s7, g2) {
            if (!m4) return e65.args = [
                p5,
                i8
            ], 1;
            o({
                target: u7,
                params: {
                    params: i8,
                    req: {
                        rs: wt(s7, f6, 1, c5, n20),
                        rj: d4
                    }
                },
                page: n20.page,
                defer: 1
            });
        }
    }, 1, 1);
    if (r24) {
        let e66;
        V(r24) ? (e66 = r24, me(e66, [
            l10
        ])) : (e66 = p(r24), me(l10, [
            e66
        ])), i7 = [
            Oe(Y(e66)),
            c4
        ];
    } else i7 = [
        c4
    ];
    u6.seq.splice(1, 0, ...i7), l10.use(n19);
    let d3 = te(n19);
    return d3 && (Object.assign(oe(l10), s(l10.shortName, d3)), l10.defaultConfig.parent = d3), mt(n19, l10, "effect"), l10;
}
function b(...t37) {
    let [[r25, n21], a15] = f(t37), o10 = {};
    return e(n21, (e67, t38)=>{
        let n22 = o10[t38] = c(t38, {
            parent: te(r25),
            config: a15
        });
        r25.on(n22, e67), mt(r25, n22);
    }), o10;
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
function k(e74) {
    ve(e74);
    let t41 = D in e74 ? e74[D]() : e74;
    r(t41.subscribe, 'expect observable to have .subscribe');
    let n25 = c(), a17 = ut(n25);
    return t41.subscribe({
        next: n25,
        error: a17,
        complete: a17
    }), n25;
}
function w(e75, t42) {
    we(e75, 'merge', 'first argument');
    let r30 = c({
        name: l(e75, 'merge'),
        derived: 1,
        and: t42
    });
    return ct(e75, r30, [], 'merge'), r30;
}
function x(e76, n26) {
    let a18 = 0;
    return t(St, (t43)=>{
        t43 in e76 && (r(null != e76[t43], $t(n26, t43)), a18 = 1);
    }), a18;
}
function S(...e77) {
    let t44, r31, n27, a19, [[o11, l13, i10], s9] = f(e77), u8 = 1;
    return be(l13) && he(o11) && x(o11, "sample") && (l13 = o11.clock, i10 = o11.fn, u8 = !o11.greedy, a19 = o11.filter, t44 = o11.target, r31 = o11.name, n27 = o11.sid, o11 = o11.source), Ct("sample", l13, o11, a19, t44, i10, r31, s9, u8, 1, 0, n27);
}
function $(...e78) {
    let [[t45, r32], n28] = f(e78);
    return r32 || (r32 = t45, t45 = r32.source), x(r32, 'guard'), Ct('guard', r32.clock, t45, r32.filter, r32.target, null, r32.name, n28, !r32.greedy, 0, 1);
}
function C(t46, r33, n29) {
    if (V(t46)) return J(0, 'restore($store)'), t46;
    if (E(t46) || B(t46)) {
        let e79 = te(t46), a20 = d(r33, {
            parent: e79,
            name: t46.shortName,
            and: n29
        });
        return ct(B(t46) ? t46.doneData : t46, a20), e79 && e79.hooks.store(a20), a20;
    }
    let a21 = Array.isArray(t46) ? [] : {};
    return e(t46, (e80, t47)=>a21[t47] = V(e80) ? e80 : d(e80, {
            name: t47
        })
    ), a21;
}
function M(...t48) {
    let n30, o12, l14 = 'split', [[i11, s10], d5] = f(t48), p6 = !s10;
    p6 && (n30 = i11.cases, s10 = i11.match, o12 = i11.clock, i11 = i11.source);
    let m5 = V(s10), g3 = !_(s10) && ye(s10), h3 = !m5 && !g3 && he(s10);
    n30 || (n30 = {}), p6 ? e(n30, (e81, t49)=>xe(l14, e81, `cases.${t49}`)
    ) : (r(h3, 'match should be an object'), e(s10, (e, t50)=>n30[t50] = c({
            derived: 1,
            and: d5
        })
    ), n30.__ = c({
        derived: 1,
        and: d5
    }));
    let y2, b1 = new Set([].concat(i11, o12 || [], Object.values(n30))), v1 = Object.keys(m5 || g3 ? n30 : s10);
    if (m5 || g3) m5 && b1.add(s10), y2 = [
        m5 && Oe(Y(s10), 0, 1),
        Ie({
            safe: m5,
            filter: 1,
            pure: !m5,
            fn (e82, t51, r34) {
                let n31 = String(m5 ? r34.a : s10(e82));
                At(t51, H(v1, n31) ? n31 : '__', e82, r34);
            }
        })
    ];
    else if (h3) {
        let t52 = Re({});
        t52.type = 'shape';
        let r35, n32 = [];
        e(s10, (e83, a22)=>{
            if (_(e83)) {
                r35 = 1, G(n32, a22), b1.add(e83);
                let o13 = ct(e83, [], [
                    Oe(t52),
                    Ne((e84, t, { a: r36  })=>r36[a22] = e84
                    )
                ]);
                if (V(e83)) {
                    t52.current[a22] = e83.getState();
                    let r37 = Y(e83);
                    _e(t52, {
                        from: r37,
                        field: a22,
                        type: 'field'
                    }), u('splitMatchStore', r37, o13);
                }
            }
        }), r35 && u('splitBase', t52), y2 = [
            r35 && Oe(t52, 0, 1),
            Fe((e85, t53, r38)=>{
                for(let a23 = 0; a23 < v1.length; a23++){
                    let o14 = v1[a23];
                    if (H(n32, o14) ? r38.a[o14] : s10[o14](e85)) return void At(t53, o14, e85, r38);
                }
                At(t53, '__', e85, r38);
            }, 1)
        ];
    } else r(0, 'expect match to be unit, function or object');
    let k1 = a({
        meta: {
            op: l14
        },
        parent: o12 ? [] : i11,
        scope: n30,
        node: y2,
        family: {
            owners: Array.from(b1)
        },
        regional: 1
    });
    if (o12 && Ct(l14, o12, i11, null, k1, null, l14, d5, 0, 0, 0), !p6) return n30;
}
function j(e86, { scope: t54 , params: r39  }) {
    if (!_(e86)) return Promise.reject(Error('first argument should be unit'));
    let n33 = g();
    n33.parentFork = Ge;
    let { fxCount: a24  } = t54;
    G(a24.scope.defers, n33);
    let l15 = [
        e86
    ], i12 = [];
    return G(i12, B(e86) ? {
        params: r39,
        req: {
            rs (e87) {
                n33.value = {
                    status: 'done',
                    value: e87
                };
            },
            rj (e88) {
                n33.value = {
                    status: 'fail',
                    value: e88
                };
            }
        }
    } : r39), G(l15, a24), G(i12, null), o({
        target: l15,
        params: i12,
        scope: t54
    }), n33.req;
}
function A(e89, r40) {
    let n34 = [];
    (function e90(a25) {
        H(n34, a25) || (G(n34, a25), "store" === ne(a25, 'op') && ne(a25, 'sid') && r40(a25, ne(a25, 'sid')), t(a25.next, e90), t(Q(a25), e90), t(X(a25), e90));
    })(e89);
}
function I(e91, n35) {
    if (Array.isArray(e91) && (e91 = new Map(e91)), e91 instanceof Map) {
        let a26 = {};
        return t(e91, (e92, t55)=>{
            r(_(t55), 'Map key should be a unit'), n35 && n35(t55, e92), r(t55.sid, 'unit should have a sid'), r(!(t55.sid in a26), 'duplicate sid found'), a26[t55.sid] = e92;
        }), a26;
    }
    return e91;
}
function q(e93, n36) {
    let o15, l16 = e93;
    L(e93) && (o15 = e93, l16 = n36);
    let i13 = ((e94)=>{
        let r41 = a({
            scope: {
                defers: [],
                inFlight: 0,
                fxID: 0
            },
            node: [
                Ne((e, t56, r42)=>{
                    te(r42) ? 'dec' === ne(te(r42).node, 'needFxCounter') ? t56.inFlight -= 1 : (t56.inFlight += 1, t56.fxID += 1) : t56.fxID += 1;
                }),
                Ie({
                    priority: "sampler",
                    batch: 1
                }),
                Ne((e95, r43)=>{
                    let { defers: n38 , fxID: a27  } = r43;
                    r43.inFlight > 0 || 0 === n38.length || Promise.resolve().then(()=>{
                        r43.fxID === a27 && t(n38.splice(0, n38.length), (e96)=>{
                            Ye(e96.parentFork), e96.rs(e96.value);
                        });
                    });
                }, 0, 1)
            ]
        }), n37 = a({
            node: [
                Ne((e97, t, r44)=>{
                    let n39 = te(r44);
                    if (n39 && te(n39)) {
                        let t57 = n39.node;
                        if (!ne(t57, 'isCombine') || 'combine' !== ne(te(n39).node, 'op')) {
                            let n40 = re(r44), a28 = t57.scope.state.id, o17 = ne(t57, 'sid');
                            n40.sidIdMap[o17] = a28, n40.sidValuesMap[o17] = e97;
                        }
                    }
                })
            ]
        }), o16 = {
            cloneOf: e94,
            reg: {},
            sidValuesMap: {},
            sidIdMap: {},
            getState (e98) {
                if ('current' in e98) return tt(Xe, o16, null, e98).current;
                let t58 = K(e98);
                return tt(Xe, o16, t58, t58.scope.state, 1).current;
            },
            kind: "scope",
            graphite: a({
                family: {
                    type: "domain",
                    links: [
                        r41,
                        n37
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
            storeChange: n37
        };
        return o16;
    })(o15);
    if (l16) {
        if (l16.values) {
            let e99 = I(l16.values, (e102)=>r(V(e102), 'Values map can contain only stores as keys')
            );
            Object.assign(i13.sidValuesMap, e99);
        }
        l16.handlers && (i13.handlers = I(l16.handlers, (e103)=>r(B(e103), "Handlers map can contain only effects as keys")
        ));
    }
    return i13;
}
function N(e104, { values: t59  }) {
    r(he(t59), 'values property should be an object');
    let n41, a29, l17, i14 = I(t59), s11 = Object.getOwnPropertyNames(i14), f7 = [], u9 = [];
    T(e104) ? (n41 = e104, l17 = 1, r(n41.cloneOf, 'scope should be created from domain'), a29 = K(n41.cloneOf)) : L(e104) ? a29 = K(e104) : r(0, 'first argument of hydrate should be domain or scope'), A(a29, (e105, t60)=>{
        H(s11, t60) && (G(f7, e105), G(u9, i14[t60]));
    }), o({
        target: f7,
        params: u9,
        scope: n41
    }), l17 && Object.assign(n41.sidValuesMap, i14);
}
function O(e106, { scope: t61  } = {}) {
    r(t61 || Ge, 'scopeBind cannot be called outside of forked .watch');
    let n42 = t61 || Ge;
    return B(e106) ? (t62)=>{
        let r45 = g();
        return o({
            target: e106,
            params: {
                params: t62,
                req: r45
            },
            scope: n42
        }), r45.req;
    } : (t63)=>(o({
            target: e106,
            params: t63,
            scope: n42
        }), t63)
    ;
}
function F(t64, n43 = {}) {
    let a30 = n43.ignore ? n43.ignore.map(({ sid: e107  })=>e107
    ) : [], o18 = {};
    return e(t64.sidValuesMap, (e108, r46)=>{
        if (H(a30, r46)) return;
        let n44 = t64.sidIdMap[r46];
        o18[r46] = n44 && n44 in t64.reg ? t64.reg[n44].current : e108;
    }), 'onlyChanges' in n43 && !n43.onlyChanges && (r(t64.cloneOf, 'scope should be created from domain'), A(K(t64.cloneOf), (e109, r47)=>{
        r47 in o18 || H(a30, r47) || ne(e109, 'isCombine') || 'ignore' === ne(e109, 'serialize') || (o18[r47] = t64.getState(e109));
    })), o18;
}
let D = 'undefined' != typeof Symbol && Symbol.observable || '@@observable', R = 'map', z = 'stack', _ = (e110)=>(ye(e110) || he(e110)) && 'kind' in e110
;
const P = (e111)=>(t65)=>_(t65) && t65.kind === e111
;
let V = P("store"), E = P("event"), B = P("effect"), L = P("domain"), T = P("scope");
var W = {
    __proto__: null,
    unit: _,
    store: V,
    event: E,
    effect: B,
    domain: L,
    scope: T
};
let H = (e112, t66)=>e112.includes(t66)
, U = (e113, t67)=>{
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
, pe = ({ sid: e129 , name: t72 , loc: r51 , method: o19 , fn: l18  })=>n(a({
        meta: {
            sidRoot: de(e129),
            name: t72,
            loc: r51,
            method: o19
        }
    }), l18)
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
}, xe = (e140, r54, n48 = "target")=>t(ge(r54), (t76)=>J(!ne(t76, 'derived'), `${e140}: derived unit in "${n48}"`, "createEvent/createStore")
    )
, Se = (e141, { fn: t77  }, { a: r55  })=>t77(e141, r55)
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
, De = {
    mov: Ae,
    compute: Ie,
    filter: ({ fn: e151 , pure: t86  })=>Ie({
            fn: e151,
            filter: 1,
            pure: t86
        })
    ,
    run: qe
}, Re = (e152)=>({
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
, dt = (e174)=>{
    let t105 = 'forward', [{ from: r73 , to: n58  }, o30] = f(e174, 1);
    return we(r73, t105, '"from"'), we(n58, t105, '"to"'), xe(t105, n58, 'to'), ut(a({
        parent: r73,
        child: n58,
        meta: {
            op: t105,
            config: o30
        },
        family: {},
        regional: 1
    }));
}, pt = (e175, t106)=>(r(ye(t106), '.watch argument should be a function'), ut(a({
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
}, vt = (t112, n62, a43, o34, i19)=>{
    let s13 = t112 ? (e185)=>e185.slice()
     : (e186)=>({
            ...e186
        })
    , f9 = t112 ? [] : {}, c7 = s13(f9), p8 = Re(c7), m6 = Re(1);
    p8.type = t112 ? 'list' : 'shape', p8.noInit = 1, u('combineBase', p8, m6);
    let g4 = d(c7, {
        name: l(a43),
        derived: 1,
        and: o34
    }), h4 = Y(g4);
    h4.noInit = 1, ae(g4, 'isCombine', 1);
    let y3 = Oe(p8);
    y3.order = {
        priority: 'barrier'
    };
    let b2 = [
        Ne((e187, t, r78)=>(r78.scope && !r78.scope.reg[p8.id] && (r78.c = 1), e187)
        ),
        y3,
        Ae({
            store: m6,
            to: 'b'
        }),
        Ne((e188, { key: t113  }, r79)=>{
            if (r79.c || e188 !== r79.a[t113]) return n62 && r79.b && (r79.a = s13(r79.a)), r79.a[t113] = e188, 1;
        }, 1),
        Ae({
            from: "a",
            target: p8
        }),
        Ae({
            from: "value",
            store: 0,
            target: m6
        }),
        Ae({
            from: "value",
            store: 1,
            target: m6,
            priority: "barrier",
            batch: 1
        }),
        Oe(p8, 1),
        i19 && Fe()
    ];
    return e(a43, (e189, t114)=>{
        if (!V(e189)) return r(!_(e189) && !be(e189), `combine expects a store in a field ${t114}`), void (c7[t114] = f9[t114] = e189);
        f9[t114] = e189.defaultState, c7[t114] = e189.getState();
        let n63 = ct(e189, g4, b2, 'combine', i19);
        n63.scope.key = t114;
        let a44 = Y(e189);
        _e(p8, {
            type: 'field',
            field: t114,
            from: a44
        }), u('combineField', a44, n63);
    }), g4.defaultShape = a43, _e(h4, {
        type: R,
        from: p8,
        fn: i19
    }), ce() || (g4.defaultState = i19 ? h4.current = i19(c7) : f9), g4;
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
}), St = [
    'source',
    'clock',
    'target'
], $t = (e194, t118)=>e194 + `: ${t118} should be defined`
;
let Ct = (e195, t119, n65, a46, o35, l24, i20, s14, f10, m7, g5, h5)=>{
    let y4 = !!o35;
    r(!be(n65) || !be(t119), $t(e195, 'either source or clock'));
    let b3 = 0;
    be(n65) ? b3 = 1 : _(n65) || (n65 = p(n65)), be(t119) ? t119 = n65 : (we(t119, e195, 'clock'), Array.isArray(t119) && (t119 = w(t119))), b3 && (n65 = t119), s14 || i20 || (i20 = n65.shortName);
    let v2 = 'none';
    (g5 || a46) && (_(a46) ? v2 = 'unit' : (r(ye(a46), '`filter` should be function or unit'), v2 = 'fn')), o35 ? (we(o35, e195, 'target'), xe(e195, o35)) : 'none' === v2 && m7 && V(n65) && V(t119) ? o35 = d(l24 ? l24(ze(Y(n65)), ze(Y(t119))) : ze(Y(n65)), {
        name: i20,
        sid: h5,
        or: s14
    }) : (o35 = c({
        name: i20,
        derived: 1,
        or: s14
    }), u('sampleTarget', K(o35)));
    let k2 = Re(), x1 = [];
    if ('unit' === v2) {
        let [r82, n66] = jt(a46, o35, t119, k2, e195);
        x1 = [
            ...Mt(n66),
            ...Mt(r82)
        ];
    }
    let [S1, $1] = jt(n65, o35, t119, k2, e195);
    return me(n65, [
        ct(t119, o35, [
            u('sampleSourceLoader'),
            Ae({
                from: z,
                target: k2
            }),
            ...Mt($1),
            Oe(S1, 1, f10),
            ...x1,
            Oe(k2),
            'fn' === v2 && Fe((e196, t, { a: r83  })=>a46(e196, r83)
            , 1),
            l24 && Fe(Se),
            u('sampleSourceUpward', y4)
        ], e195, l24)
    ]), o35;
};
const Mt = (e197)=>[
        Oe(e197),
        Ne((e, t, { a: r84  })=>r84
        , 1)
    ]
, jt = (e198, t120, r85, n67, o36)=>{
    let l25 = V(e198), i21 = l25 ? Y(e198) : Re(), s15 = Re(l25);
    return l25 || a({
        parent: e198,
        node: [
            Ae({
                from: z,
                target: i21
            }),
            Ae({
                from: "value",
                store: 1,
                target: s15
            })
        ],
        family: {
            owners: [
                e198,
                t120,
                r85
            ],
            links: t120
        },
        meta: {
            op: o36
        },
        regional: 1
    }), u('sampleSource', s15, i21, n67), [
        i21,
        s15
    ];
}, At = (e199, t121, r86, n68)=>{
    let a47 = e199[t121];
    a47 && o({
        target: a47,
        params: Array.isArray(a47) ? a47.map(()=>r86
        ) : r86,
        defer: 1,
        stack: n68
    });
}, It = "22.2.0";
export { j as allSettled, y as attach, ft as clearNode, p as combine, b as createApi, v as createDomain, h as createEffect, c as createEvent, a as createNode, d as createStore, m as createStoreObject, q as fork, dt as forward, k as fromObservable, $ as guard, N as hydrate, W as is, o as launch, w as merge, C as restore, S as sample, O as scopeBind, F as serialize, i as setStoreName, M as split, De as step, It as version, pe as withFactory, n as withRegion };
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
    let u1 = -1;
    const r1 = 10 ** dp;
    do {
        bytes /= thresh;
        ++u1;
    }while (Math.round(Math.abs(bytes) * r1) / r1 >= thresh && u1 < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u1];
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
function typicalConnectionValidator(pingURL) {
    return {
        validationEndpointURL: pingURL,
        validate: ()=>{
            return fetch(pingURL, {
                method: "HEAD"
            });
        }
    };
}
var ReconnectionState;
(function(ReconnectionState1) {
    ReconnectionState1["IDLE"] = "idle";
    ReconnectionState1["TRYING"] = "trying";
    ReconnectionState1["COMPLETED"] = "completed";
    ReconnectionState1["ABORTED"] = "aborted";
})(ReconnectionState || (ReconnectionState = {}));
class ReconnectionStrategy {
    maxAttempts;
    intervalMillecs;
    onStateChange;
    #state = ReconnectionState.IDLE;
    #attempt = 0;
    constructor(options){
        this.maxAttempts = options?.maxAttempts ?? 15;
        this.intervalMillecs = options?.intervalMillecs ?? 1000;
        this.onStateChange = options?.onStateChange;
    }
    get isTrying() {
        return this.#state == ReconnectionState.TRYING;
    }
    get isAborted() {
        return this.#state == ReconnectionState.ABORTED;
    }
    get attempt() {
        return this.#attempt;
    }
    get state() {
        return this.#state;
    }
    set state(value) {
        const previousStatus = this.#state;
        this.#state = value;
        this.onStateChange?.(this.#state, previousStatus, this);
    }
    reconnect() {
        this.#attempt++;
        if (this.#attempt > this.maxAttempts) {
            this.completed(ReconnectionState.ABORTED);
        } else {
            this.state = ReconnectionState.TRYING;
        }
        return this;
    }
    completed(status = ReconnectionState.COMPLETED) {
        this.state = status;
        return this;
    }
}
export { typicalConnectionValidator as typicalConnectionValidator };
export { ReconnectionState as ReconnectionState };
export { ReconnectionStrategy as ReconnectionStrategy };
function typeGuard(...requireKeysInSingleT) {
    return (o1)=>{
        if (o1 && typeof o1 === "object") {
            return !requireKeysInSingleT.find((p1)=>!(p1 in o1)
            );
        }
        return false;
    };
}
const isEventSourceConnectionHealthy = typeGuard("isHealthy", "connEstablishedOn");
const isEventSourceConnectionUnhealthy = typeGuard("isHealthy", "connFailedOn");
const isEventSourceReconnecting = typeGuard("isHealthy", "connFailedOn", "reconnectStrategy");
const isEventSourceError = typeGuard("isEventSourceError", "errorEvent");
const isEventSourceEndpointUnavailable = typeGuard("isEndpointUnavailable", "endpointURL");
class EventSourceTunnel {
    esURL;
    esEndpointValidator;
    observerUniversalScopeID = "universal";
    eventSourceFactory;
    onConnStateChange;
    onReconnStateChange;
    #connectionState = {
        isConnectionState: true
    };
    #reconnStrategy;
    constructor(init){
        this.esURL = init.esURL;
        this.esEndpointValidator = init.esEndpointValidator;
        this.eventSourceFactory = init.eventSourceFactory;
        this.onConnStateChange = init.options?.onConnStateChange;
        this.onReconnStateChange = init.options?.onReconnStateChange;
    }
    isReconnecting() {
        return this.#reconnStrategy ? this.#reconnStrategy : false;
    }
    isReconnectAborted() {
        return this.#reconnStrategy && this.#reconnStrategy.isAborted ? true : false;
    }
    connected(es, connState) {
        if (this.#reconnStrategy) this.#reconnStrategy.completed();
        this.eventSourceFactory.connected?.(es);
        this.connectionState = connState;
        this.#reconnStrategy = undefined;
    }
    prepareReconnect(connState) {
        this.#reconnStrategy = this.#reconnStrategy ?? new ReconnectionStrategy({
            onStateChange: this.onReconnStateChange ? (active, previous, rs)=>{
                this.onReconnStateChange?.(active, previous, rs, this);
            } : undefined
        });
        connState = {
            ...connState,
            reconnectStrategy: this.#reconnStrategy
        };
        this.connectionState = connState;
        return this.#reconnStrategy.reconnect();
    }
    init() {
        if (this.isReconnectAborted()) return;
        this.esEndpointValidator.validate(this.#reconnStrategy).then((resp)=>{
            if (resp.ok) {
                const eventSource = this.eventSourceFactory.construct(this.esURL);
                const coercedES = eventSource;
                coercedES.onopen = ()=>{
                    this.connected(eventSource, {
                        isConnectionState: true,
                        isHealthy: true,
                        connEstablishedOn: new Date(),
                        endpointURL: this.esURL,
                        pingURL: this.esEndpointValidator.validationEndpointURL.toString()
                    });
                };
                coercedES.onerror = (event)=>{
                    coercedES.close();
                    const connState = {
                        isConnectionState: true,
                        isHealthy: false,
                        connFailedOn: new Date(),
                        isEventSourceError: true,
                        errorEvent: event
                    };
                    const reconnectStrategy = this.prepareReconnect(connState);
                    setTimeout(()=>this.init()
                    , reconnectStrategy.intervalMillecs);
                };
            } else {
                const connState = {
                    isConnectionState: true,
                    isHealthy: false,
                    connFailedOn: new Date(),
                    isEndpointUnavailable: true,
                    endpointURL: this.esURL,
                    pingURL: this.esEndpointValidator.validationEndpointURL.toString(),
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                };
                const reconnectStrategy = this.prepareReconnect(connState);
                setTimeout(()=>this.init()
                , reconnectStrategy.intervalMillecs);
            }
        }).catch((connectionError)=>{
            const connState = {
                isConnectionState: true,
                isHealthy: false,
                connFailedOn: new Date(),
                pingURL: this.esEndpointValidator.validationEndpointURL.toString(),
                connectionError,
                isEndpointUnavailable: true,
                endpointURL: this.esURL
            };
            const reconnectStrategy = this.prepareReconnect(connState);
            setTimeout(()=>this.init()
            , reconnectStrategy.intervalMillecs);
        });
        return this;
    }
    get connectionState() {
        return this.#connectionState;
    }
    set connectionState(value) {
        const previousConnState = this.#connectionState;
        this.#connectionState = value;
        this.onConnStateChange?.(this.#connectionState, previousConnState, this);
    }
}
function eventSourceConnNarrative(tunnel) {
    const sseState = tunnel.connectionState;
    const reconn = tunnel.isReconnecting();
    let reconnected = false;
    if (reconn) {
        switch(reconn.state){
            case ReconnectionState.TRYING:
                return {
                    summary: `reconnecting ${reconn.attempt}/${reconn.maxAttempts}`,
                    color: "orange",
                    isHealthy: false,
                    summaryHint: `Trying to reconnect to ${tunnel.esURL} (ES), reconnecting every ${reconn.intervalMillecs} milliseconds`
                };
            case ReconnectionState.ABORTED:
                return {
                    summary: `ABORTED`,
                    color: "red",
                    isHealthy: false,
                    summaryHint: `Unable to reconnect to ${tunnel.esURL} (ES) after ${reconn.maxAttempts} attempts, giving up`
                };
            case ReconnectionState.COMPLETED:
                reconnected = true;
                break;
        }
    }
    if (isEventSourceConnectionHealthy(sseState)) {
        return {
            summary: reconnected ? "reconnected" : "connected",
            color: "green",
            isHealthy: true,
            summaryHint: `Connection to ${sseState.endpointURL} (ES) verified using ${sseState.pingURL} on ${sseState.connEstablishedOn}`
        };
    }
    let summary = "unknown";
    let color = "purple";
    let summaryHint = `the EventSource tunnel is not healthy, but not sure why`;
    if (isEventSourceConnectionUnhealthy(sseState)) {
        if (isEventSourceEndpointUnavailable(sseState)) {
            summary = "ES unavailable";
            summaryHint = `${sseState.endpointURL} (ES) not available`;
            if (sseState.httpStatus) {
                summary = `ES unavailable (${sseState.httpStatus})`;
                summaryHint += ` (HTTP status: ${sseState.httpStatus}, ${sseState.httpStatusText})`;
                color = "red";
            }
        } else {
            if (isEventSourceError(sseState)) {
                summary = "error";
                summaryHint = JSON.stringify(sseState.errorEvent);
                color = "red";
            }
        }
    }
    return {
        isHealthy: false,
        summary,
        summaryHint,
        color
    };
}
export { isEventSourceConnectionHealthy as isEventSourceConnectionHealthy };
export { isEventSourceConnectionUnhealthy as isEventSourceConnectionUnhealthy };
export { isEventSourceReconnecting as isEventSourceReconnecting };
export { isEventSourceError as isEventSourceError };
export { isEventSourceEndpointUnavailable as isEventSourceEndpointUnavailable };
export { EventSourceTunnel as EventSourceTunnel };
export { eventSourceConnNarrative as eventSourceConnNarrative };
const isIdentifiablePayload = typeGuard("payloadIdentity");
typeGuard("isValidatedPayload", "isValidPayload");
function isEventSourceService(o2) {
    const isType = typeGuard("isEventSourcePayload", "prepareEventSourcePayload");
    return isType(o2);
}
function serviceBusArguments(options) {
    const universalScopeID = "universal";
    return {
        eventNameStrategy: {
            universalScopeID,
            fetch: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `fetch-${identity}`;
                const universalName = `fetch`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            fetchResponse: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `fetch-response-${identity}`;
                const universalName = `fetch-response`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            fetchError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `fetch-error-${identity}`;
                const universalName = `fetch-error`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            eventSource: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `event-source-${identity}`;
                const universalName = `event-source`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            eventSourceError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `event-source-error-${identity}`;
                const universalName = `event-source-error`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            eventSourceInvalidPayload: ()=>{
                const universalName = `event-source-invalid-payload`;
                return {
                    payloadSpecificName: undefined,
                    universalName,
                    selectedName: universalName
                };
            },
            webSocket: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `web-socket-${identity}`;
                const universalName = `web-socket`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            webSocketError: (payload)=>{
                const identity = typeof payload === "string" ? payload : payload.payloadIdentity;
                const payloadSpecificName = `web-socket-error-${identity}`;
                const universalName = `web-socket-error`;
                return {
                    payloadSpecificName,
                    universalName,
                    selectedName: identity == universalScopeID ? universalName : payloadSpecificName
                };
            },
            webSocketInvalidPayload: ()=>{
                const universalName = `web-socket-invalid-payload`;
                return {
                    payloadSpecificName: undefined,
                    universalName,
                    selectedName: universalName
                };
            }
        },
        ...options
    };
}
class ServiceBus extends EventTarget {
    args;
    esTunnels = [];
    wsTunnels = [];
    eventListenersLog = [];
    constructor(args){
        super();
        this.args = args;
        if (args.esTunnels) this.registerEventSourceTunnels(args.esTunnels);
        if (args.wsTunnels) this.registerWebSocketTunnels(args.wsTunnels);
    }
    registerEventSourceTunnels(ests) {
        for (const tunnel of ests((event)=>{
            const eventSrcPayload = JSON.parse(event.data);
            const esDetail = {
                event,
                eventSrcPayload
            };
            this.dispatchNamingStrategyEvent(eventSrcPayload, isIdentifiablePayload(eventSrcPayload) ? this.args.eventNameStrategy.eventSource : this.args.eventNameStrategy.eventSourceInvalidPayload, esDetail);
        })){
            this.esTunnels.push(tunnel);
        }
    }
    registerWebSocketTunnels(ests) {
        for (const tunnel of ests((event)=>{
            if (typeof event.data === "string") {
                const payload = JSON.parse(event.data);
                const wsDetail = {
                    event,
                    payload,
                    webSocketStrategy: this
                };
                this.dispatchNamingStrategyEvent(payload, isIdentifiablePayload(payload) ? this.args.eventNameStrategy.webSocket : this.args.eventNameStrategy.webSocketInvalidPayload, wsDetail);
            } else {
                const payload = event.data;
                if (isIdentifiablePayload(payload)) {
                    const wsDetail = {
                        event,
                        payload,
                        webSocketStrategy: this
                    };
                    this.dispatchNamingStrategyEvent(payload, this.args.eventNameStrategy.webSocket, wsDetail);
                } else {
                    this.dispatchNamingStrategyEvent(event.data, this.args.eventNameStrategy.webSocketInvalidPayload, {
                        event,
                        webSocketStrategy: this
                    });
                }
            }
        })){
            this.wsTunnels.push(tunnel);
        }
    }
    dispatchNamingStrategyEvent(id, strategy, detail) {
        const names = strategy(id);
        if (names.payloadSpecificName) {
            this.dispatchEvent(new CustomEvent(names.payloadSpecificName, {
                detail
            }));
        }
        this.dispatchEvent(new CustomEvent(names.universalName, {
            detail
        }));
    }
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
        this.eventListenersLog.push({
            name: type,
            hook: listener
        });
    }
    observeUnsolicitedPayload(observer, payloadIdSupplier) {
        this.observeEventSource((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
        this.observeWebSocketReceiveEvent((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
    }
    observeReceivedPayload(observer, payloadIdSupplier) {
        this.observeEventSource((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
        this.observeWebSocketReceiveEvent((payload)=>{
            observer(payload, this);
        }, payloadIdSupplier);
        this.observeFetchEventResponse((_fetched, received)=>{
            observer(received, this);
        }, payloadIdSupplier);
    }
    observeSolicitedPayload(observer, payloadIdSupplier) {
        this.observeFetchEventResponse((payload, responsePayload, ctx)=>{
            observer(payload, responsePayload, ctx, this);
        }, payloadIdSupplier);
    }
    fetch(uase, suggestedCtx) {
        const transactionID = "TODO:UUIDv5?";
        const clientProvenance = "ServiceBus.fetch";
        const ctx = {
            ...suggestedCtx,
            transactionID,
            clientProvenance
        };
        const fetchPayload = uase.prepareFetchPayload(ctx, this);
        const fetchInit = uase.prepareFetch(this.args.fetchBaseURL, fetchPayload, ctx, this);
        const fetchDetail = {
            ...fetchInit,
            fetchPayload,
            context: ctx,
            fetchStrategy: this
        };
        this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetch, fetchDetail);
        fetch(fetchInit.endpoint, fetchInit.requestInit).then((resp)=>{
            if (resp.ok) {
                resp.json().then((fetchRespRawJSON)=>{
                    const fetchRespPayload = uase.prepareFetchResponsePayload(fetchPayload, fetchRespRawJSON, ctx, this);
                    const fetchRespDetail = {
                        fetchPayload,
                        fetchRespPayload,
                        context: ctx,
                        fetchStrategy: this
                    };
                    this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchResponse, fetchRespDetail);
                });
            } else {
                const fetchErrorDetail = {
                    ...fetchInit,
                    fetchPayload,
                    context: ctx,
                    error: new Error(`${fetchInit.endpoint} invalid HTTP status ${resp.status} (${resp.statusText})`),
                    fetchStrategy: this
                };
                this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchError, fetchErrorDetail);
            }
        }).catch((error)=>{
            const fetchErrorDetail = {
                ...fetchInit,
                fetchPayload,
                context: ctx,
                error,
                fetchStrategy: this
            };
            this.dispatchNamingStrategyEvent(fetchPayload, this.args.eventNameStrategy.fetchError, fetchErrorDetail);
            console.error(`${fetchInit.endpoint} POST error`, error, fetchInit);
        });
    }
    observeFetchEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.fetch(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchPayload, requestInit, context, fetchStrategy);
        });
    }
    observeFetchEventResponse(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.fetchResponse(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , fetchRespPayload , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(fetchRespPayload, fetchPayload, context, fetchStrategy);
        });
    }
    observeFetchEventError(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.fetchError(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { fetchPayload , error , requestInit , context , fetchStrategy  } = typedCustomEvent.detail;
            observer(error, requestInit, fetchPayload, context, fetchStrategy);
        });
    }
    observeEventSource(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.eventSource(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            let { eventSrcPayload  } = typedCustomEvent.detail;
            if (isEventSourceService(payloadIdSupplier)) {
                if (payloadIdSupplier.isEventSourcePayload(eventSrcPayload)) {
                    eventSrcPayload = payloadIdSupplier.prepareEventSourcePayload(eventSrcPayload);
                    eventSrcPayload.isValidatedPayload = true;
                }
            }
            observer(eventSrcPayload, this);
        });
    }
    observeEventSourceError(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.eventSourceError(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { eventSrcPayload , error  } = typedCustomEvent.detail;
            observer(error, eventSrcPayload, this);
        });
    }
    webSocketSend(context, wss) {
        for (const ws of this.wsTunnels){
            ws.activeSocket?.send(wss.prepareWebSocketSend(wss.prepareWebSocketSendPayload(context, this), this));
        }
    }
    prepareWebSocketReceivePayload(webSocketReceiveRaw) {
        if (typeof webSocketReceiveRaw !== "string") {
            throw Error(`webSocketReceiveRaw must be text; TODO: allow binary?`);
        }
        return JSON.parse(webSocketReceiveRaw);
    }
    observeWebSocketSendEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.webSocket(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { context , payload , webSocketStrategy  } = typedCustomEvent.detail;
            observer(payload, context, webSocketStrategy);
        });
    }
    observeWebSocketReceiveEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.webSocket(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            let { payload  } = typedCustomEvent.detail;
            if (isEventSourceService(payloadIdSupplier)) {
                if (payloadIdSupplier.isEventSourcePayload(payload)) {
                    payload = payloadIdSupplier.prepareEventSourcePayload(payload);
                    payload.isValidatedPayload = true;
                }
            }
            observer(payload, this);
        });
    }
    observeWebSocketErrorEvent(observer, payloadIdSupplier) {
        const payloadID = payloadIdSupplier ? typeof payloadIdSupplier === "string" ? payloadIdSupplier : payloadIdSupplier.payloadIdentity : this.args.eventNameStrategy.universalScopeID;
        const names = this.args.eventNameStrategy.webSocketError(payloadID);
        this.addEventListener(names.selectedName, (event)=>{
            const typedCustomEvent = event;
            const { error  } = typedCustomEvent.detail;
            observer(error, undefined, this);
        });
    }
}
export { serviceBusArguments as serviceBusArguments };
export { ServiceBus as ServiceBus };
const isWebSocketConnectionHealthy = typeGuard("isHealthy", "connEstablishedOn");
const isWebSocketConnectionUnhealthy = typeGuard("isHealthy", "connFailedOn");
const isWebSocketReconnecting = typeGuard("isHealthy", "connFailedOn", "reconnectStrategy");
const isWebSocketErrorEventSupplier = typeGuard("isEventSourceError", "errorEvent");
const isWebSocketCloseEventSupplier = typeGuard("isCloseEvent", "closeEvent");
const isWebSocketEndpointUnavailable = typeGuard("isEndpointUnavailable", "endpointURL");
class WebSocketTunnel {
    wsURL;
    wsEndpointValidator;
    observerUniversalScopeID = "universal";
    webSocketFactory;
    onConnStateChange;
    onReconnStateChange;
    allowClose;
    #activeSocket;
    #connectionState = {
        isConnectionState: true
    };
    #reconnStrategy;
    constructor(init){
        this.wsURL = init.wsURL;
        this.wsEndpointValidator = init.wsEndpointValidator;
        this.webSocketFactory = init.webSocketFactory;
        this.onConnStateChange = init.options?.onConnStateChange;
        this.onReconnStateChange = init.options?.onReconnStateChange;
        this.allowClose = init.options?.allowClose;
    }
    isReconnecting() {
        return this.#reconnStrategy ? this.#reconnStrategy : false;
    }
    isReconnectAborted() {
        return this.#reconnStrategy && this.#reconnStrategy.isAborted ? true : false;
    }
    connected(ws, connState) {
        if (this.#reconnStrategy) this.#reconnStrategy.completed();
        this.webSocketFactory.connected?.(ws);
        this.connectionState = connState;
        this.#reconnStrategy = undefined;
    }
    prepareReconnect(connState) {
        this.#reconnStrategy = this.#reconnStrategy ?? new ReconnectionStrategy({
            onStateChange: this.onReconnStateChange ? (active, previous, rs)=>{
                this.onReconnStateChange?.(active, previous, rs, this);
            } : undefined
        });
        connState = {
            ...connState,
            reconnectStrategy: this.#reconnStrategy
        };
        this.connectionState = connState;
        return this.#reconnStrategy.reconnect();
    }
    init() {
        if (this.isReconnectAborted()) return;
        this.wsEndpointValidator.validate(this.#reconnStrategy).then((resp)=>{
            if (resp.ok) {
                if (this.#activeSocket) this.#activeSocket.close();
                this.#activeSocket = undefined;
                const ws = this.#activeSocket = this.webSocketFactory.construct(this.wsURL);
                ws.onopen = ()=>{
                    this.connected(ws, {
                        isConnectionState: true,
                        isHealthy: true,
                        connEstablishedOn: new Date(),
                        endpointURL: this.wsURL,
                        pingURL: this.wsEndpointValidator.validationEndpointURL.toString()
                    });
                };
                ws.onclose = (event)=>{
                    const allowClose = this.allowClose?.(event, this) ?? false;
                    if (!allowClose) {
                        const connState = {
                            isConnectionState: true,
                            isHealthy: false,
                            connFailedOn: new Date(),
                            isCloseEvent: true,
                            closeEvent: event
                        };
                        const reconnectStrategy = this.prepareReconnect(connState);
                        setTimeout(()=>this.init()
                        , reconnectStrategy.intervalMillecs);
                    }
                };
                ws.onerror = (event)=>{
                    ws.close();
                    const connState = {
                        isConnectionState: true,
                        isHealthy: false,
                        connFailedOn: new Date(),
                        isEventSourceError: true,
                        errorEvent: event
                    };
                    const reconnectStrategy = this.prepareReconnect(connState);
                    setTimeout(()=>this.init()
                    , reconnectStrategy.intervalMillecs);
                };
            } else {
                const connState = {
                    isConnectionState: true,
                    isHealthy: false,
                    connFailedOn: new Date(),
                    isEndpointUnavailable: true,
                    endpointURL: this.wsURL,
                    pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
                    httpStatus: resp.status,
                    httpStatusText: resp.statusText
                };
                const reconnectStrategy = this.prepareReconnect(connState);
                setTimeout(()=>this.init()
                , reconnectStrategy.intervalMillecs);
            }
        }).catch((connectionError)=>{
            const connState = {
                isConnectionState: true,
                isHealthy: false,
                connFailedOn: new Date(),
                pingURL: this.wsEndpointValidator.validationEndpointURL.toString(),
                connectionError,
                isEndpointUnavailable: true,
                endpointURL: this.wsURL
            };
            const reconnectStrategy = this.prepareReconnect(connState);
            setTimeout(()=>this.init()
            , reconnectStrategy.intervalMillecs);
        });
        return this;
    }
    get activeSocket() {
        return this.#activeSocket;
    }
    get connectionState() {
        return this.#connectionState;
    }
    set connectionState(value) {
        const previousConnState = this.#connectionState;
        this.#connectionState = value;
        this.onConnStateChange?.(this.#connectionState, previousConnState, this);
    }
}
function webSocketConnNarrative(tunnel, reconn) {
    const ws = tunnel.connectionState;
    if (!reconn && isWebSocketReconnecting(ws)) {
        reconn = ws.reconnectStrategy;
    }
    let reconnected = false;
    if (reconn) {
        switch(reconn.state){
            case ReconnectionState.TRYING:
                return {
                    summary: `reconnecting ${reconn.attempt}/${reconn.maxAttempts}`,
                    color: "orange",
                    isHealthy: false,
                    summaryHint: `Trying to reconnect to ${tunnel.wsURL} (WS), reconnecting every ${reconn.intervalMillecs} milliseconds`
                };
            case ReconnectionState.ABORTED:
                return {
                    summary: `failed`,
                    color: "red",
                    isHealthy: false,
                    summaryHint: `Unable to reconnect to ${tunnel.wsURL} (WS) after ${reconn.maxAttempts} attempts, giving up`
                };
            case ReconnectionState.COMPLETED:
                reconnected = true;
                break;
        }
    }
    if (isWebSocketConnectionHealthy(ws)) {
        return {
            summary: reconnected ? "reconnected" : "connected",
            color: "green",
            isHealthy: true,
            summaryHint: `Connection to ${ws.endpointURL} (WS) verified using ${ws.pingURL} on ${ws.connEstablishedOn}`
        };
    }
    let summary = "unknown";
    let color = "purple";
    let summaryHint = `the WebSocket tunnel is not healthy, but not sure why`;
    if (isWebSocketConnectionUnhealthy(ws)) {
        if (isWebSocketEndpointUnavailable(ws)) {
            summary = "WS unavailable";
            summaryHint = `${ws.endpointURL} not available`;
            if (ws.httpStatus) {
                summary = `WS unavailable (${ws.httpStatus})`;
                summaryHint += ` (HTTP status: ${ws.httpStatus}, ${ws.httpStatusText})`;
                color = "red";
            }
        } else {
            if (isWebSocketErrorEventSupplier(ws)) {
                summary = "error";
                summaryHint = JSON.stringify(ws.errorEvent);
                color = "red";
            }
        }
    }
    return {
        isHealthy: false,
        summary,
        summaryHint,
        color
    };
}
export { isWebSocketConnectionHealthy as isWebSocketConnectionHealthy };
export { isWebSocketConnectionUnhealthy as isWebSocketConnectionUnhealthy };
export { isWebSocketReconnecting as isWebSocketReconnecting };
export { isWebSocketErrorEventSupplier as isWebSocketErrorEventSupplier };
export { isWebSocketCloseEventSupplier as isWebSocketCloseEventSupplier };
export { isWebSocketEndpointUnavailable as isWebSocketEndpointUnavailable };
export { WebSocketTunnel as WebSocketTunnel };
export { webSocketConnNarrative as webSocketConnNarrative };
class EventEmitter {
    _events_ = new Map();
    on(event, listener) {
        if (!this._events_.has(event)) this._events_.set(event, new Set());
        this._events_.get(event).add(listener);
        return this;
    }
    once(event, listener) {
        const l1 = listener;
        l1.__once__ = true;
        return this.on(event, l1);
    }
    off(event, listener) {
        if ((event === undefined || event === null) && listener) throw new Error("Why is there a listener defined here?");
        else if ((event === undefined || event === null) && !listener) this._events_.clear();
        else if (event && !listener) this._events_.delete(event);
        else if (event && listener && this._events_.has(event)) {
            const _1 = this._events_.get(event);
            _1.delete(listener);
            if (_1.size === 0) this._events_.delete(event);
        } else ;
        return this;
    }
    emitSync(event, ...args) {
        if (!this._events_.has(event)) return this;
        const _2 = this._events_.get(event);
        for (let [, listener] of _2.entries()){
            const r2 = listener(...args);
            if (r2 instanceof Promise) r2.catch(console.error);
            if (listener.__once__) {
                delete listener.__once__;
                _2.delete(listener);
            }
        }
        if (_2.size === 0) this._events_.delete(event);
        return this;
    }
    async emit(event, ...args) {
        if (!this._events_.has(event)) return this;
        const _3 = this._events_.get(event);
        for (let [, listener] of _3.entries()){
            try {
                await listener(...args);
                if (listener.__once__) {
                    delete listener.__once__;
                    _3.delete(listener);
                }
            } catch (error) {
                console.error(error);
            }
        }
        if (_3.size === 0) this._events_.delete(event);
        return this;
    }
    queue(event, ...args) {
        (async ()=>await this.emit(event, ...args)
        )().catch(console.error);
        return this;
    }
    pull(event, timeout) {
        return new Promise(async (resolve, reject)=>{
            let timeoutId;
            let listener = (...args)=>{
                if (timeoutId !== null) clearTimeout(timeoutId);
                resolve(args);
            };
            timeoutId = typeof timeout !== "number" ? null : setTimeout(()=>(this.off(event, listener), reject(new Error("Timed out!")))
            );
            this.once(event, listener);
        });
    }
    clone(cloneListeners = true) {
        const emitter = new EventEmitter();
        if (cloneListeners) {
            for (const [key, set] of this._events_)emitter._events_.set(key, new Set([
                ...set
            ]));
        }
        return emitter;
    }
}
export { EventEmitter as EventEmitter };
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
function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r3, a1)=>Math.min(r3, a1.length)
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
const jsTokenEvalRE = /^[a-zA-Z0-9_]+$/;
function jsTokenEvalResult(identity, discover, isTokenValid, onInvalidToken, onFailedDiscovery) {
    let result;
    if (identity.match(jsTokenEvalRE)) {
        try {
            if (Array.isArray(discover)) {
                for (const te1 of discover){
                    result = te1(identity);
                    if (result) break;
                }
            } else {
                result = discover(identity);
            }
            if (result && isTokenValid) result = isTokenValid(result, identity);
        } catch (error) {
            result = onFailedDiscovery?.(error, identity);
        }
    } else {
        result = onInvalidToken?.(identity);
    }
    return result;
}
const jsTokenEvalResults = {};
function cacheableJsTokenEvalResult(name1, discover = eval, onInvalidToken, onFailedDiscovery) {
    if (name1 in jsTokenEvalResults) return jsTokenEvalResults[name1];
    return jsTokenEvalResult(name1, discover, (value, name)=>{
        jsTokenEvalResults[name] = value;
        return value;
    }, onInvalidToken, onFailedDiscovery);
}
function* walkHooks(targets, hookNameSuppliers, discover, prepareWalkEntry) {
    const suppliers = Array.isArray(hookNameSuppliers) ? hookNameSuppliers : [
        hookNameSuppliers
    ];
    for (const target of targets){
        for (const hookNameSupplier of suppliers){
            const hookName = hookNameSupplier(target);
            if (hookName) {
                const hookDiscovered = jsTokenEvalResult(hookName, discover, (value)=>value
                , (name)=>{
                    console.log(`[discoverDomElemHook] '${name}' is not a token in current scope for`, target);
                    return undefined;
                });
                let hookExecArgs = {
                    target,
                    hookDiscovered,
                    hookName,
                    hookNameSupplier
                };
                if (prepareWalkEntry) {
                    const prepared = prepareWalkEntry(hookExecArgs);
                    if (!prepared) continue;
                    hookExecArgs = prepared;
                }
                const hookExecResult = hookDiscovered && typeof hookDiscovered === "function" ? hookDiscovered(hookExecArgs) : undefined;
                yield hookExecResult ?? hookExecArgs;
            }
        }
    }
}
function flexibleArgs(argsSupplier, rulesSupplier) {
    const rules = rulesSupplier ? typeof rulesSupplier === "function" ? rulesSupplier(argsSupplier) : rulesSupplier : undefined;
    const defaultArgsSupplier = rules?.defaultArgs ?? {};
    const defaultArgs = typeof defaultArgsSupplier === "function" ? defaultArgsSupplier(argsSupplier, rules) : defaultArgsSupplier;
    let args = typeof argsSupplier === "function" ? argsSupplier(defaultArgs, rules) : argsSupplier ? {
        ...defaultArgs,
        ...argsSupplier
    } : defaultArgs;
    if (rules?.argsGuard) {
        if (!rules?.argsGuard.guard(args)) {
            args = rules.argsGuard.onFailure(args, rules);
        }
    }
    let result = {
        args,
        rules
    };
    if (rules?.finalizeResult) {
        result = rules.finalizeResult(result);
    }
    return result;
}
function governedArgs(argsSupplier, rulesSupplier) {
    const result = flexibleArgs(argsSupplier, rulesSupplier);
    return result;
}
export { jsTokenEvalResult as jsTokenEvalResult };
export { cacheableJsTokenEvalResult as cacheableJsTokenEvalResult };
export { walkHooks as walkHooks };
export { flexibleArgs as flexibleArgs };
export { governedArgs as governedArgs };
const posixPathRE = /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
function detectFileSysStyleRoute(text) {
    const components = posixPathRE.exec(text)?.slice(1);
    if (!components || components.length !== 5) return undefined;
    const modifiers = [];
    const parsedPath = {
        root: components[1],
        dir: components[0].slice(0, -1),
        base: components[2],
        ext: components[4],
        name: components[3],
        modifiers
    };
    const modifierIndex = parsedPath.name.lastIndexOf(".");
    if (modifierIndex > 0) {
        let ppn = parsedPath.name;
        let modifier = ppn.substring(modifierIndex);
        while(modifier && modifier.length > 0){
            modifiers.push(modifier);
            ppn = ppn.substring(0, ppn.length - modifier.length);
            const modifierIndex = ppn.lastIndexOf(".");
            modifier = modifierIndex > 0 ? ppn.substring(modifierIndex) : undefined;
        }
        parsedPath.name = ppn;
    }
    return parsedPath;
}
export { detectFileSysStyleRoute as detectFileSysStyleRoute };
const pingPayloadIdentity = "ping";
function isPingPayload(o3) {
    if (isIdentifiablePayload(o3)) {
        if (o3.payloadIdentity == pingPayloadIdentity) {
            return true;
        }
    }
    return false;
}
function pingPayload() {
    return {
        payloadIdentity: pingPayloadIdentity
    };
}
function pingWebSocketSendPayload() {
    return JSON.stringify(pingPayload());
}
function pingService(endpointSupplier) {
    const service = {
        serviceIdentity: pingPayloadIdentity,
        payloadIdentity: pingPayloadIdentity,
        fetch: (fetchStrategy, ctx)=>{
            fetchStrategy.fetch(service, ctx);
        },
        prepareFetch: (baseURL, payload)=>{
            return {
                endpoint: endpointSupplier(baseURL),
                requestInit: {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            };
        },
        prepareFetchContext: (ctx)=>ctx
        ,
        prepareFetchPayload: (ctx)=>{
            return {
                payloadIdentity: pingPayloadIdentity,
                ...ctx
            };
        },
        prepareFetchResponsePayload: (fetchPayload, fetchRespRawJSON)=>{
            return {
                payloadIdentity: fetchPayload.payloadIdentity,
                fetchPayload,
                fetchRespRawJSON
            };
        },
        isEventSourcePayload: (_rawJSON)=>{
            return true;
        },
        prepareEventSourcePayload: (rawJSON)=>{
            const validated = rawJSON;
            validated.isValidatedPayload = true;
            validated.isValidPayload = true;
            return validated;
        },
        isWebSocketReceivePayload: (_rawJSON)=>true
        ,
        prepareWebSocketReceivePayload: (rawJSON)=>{
            const validated = rawJSON;
            validated.isValidatedPayload = true;
            validated.isValidPayload = true;
            return validated;
        }
    };
    return service;
}
export { pingPayloadIdentity as pingPayloadIdentity };
export { isPingPayload as isPingPayload };
export { pingPayload as pingPayload };
export { pingWebSocketSendPayload as pingWebSocketSendPayload };
export { pingService as pingService };
const serverFileImpactPayloadIdentity = "serverFileImpact";
function isServerFileImpact(o4) {
    if (isIdentifiablePayload(o4)) {
        if (o4.payloadIdentity == serverFileImpactPayloadIdentity) {
            return true;
        }
    }
    return false;
}
function serverFileImpact(sfi) {
    return {
        payloadIdentity: serverFileImpactPayloadIdentity,
        ...sfi
    };
}
function serverFileImpactService() {
    const proxy = {
        serviceIdentity: serverFileImpactPayloadIdentity,
        payloadIdentity: serverFileImpactPayloadIdentity,
        isEventSourcePayload: (rawJSON)=>{
            return isServerFileImpact(rawJSON);
        },
        prepareEventSourcePayload: (rawJSON)=>{
            const validated = rawJSON;
            validated.isValidatedPayload = true;
            validated.isValidPayload = true;
            return validated;
        },
        isWebSocketReceivePayload: (rawJSON)=>{
            return isServerFileImpact(rawJSON);
        },
        prepareWebSocketReceivePayload: (rawJSON)=>{
            const validated = rawJSON;
            validated.isValidatedPayload = true;
            validated.isValidPayload = true;
            return validated;
        }
    };
    return proxy;
}
export { serverFileImpactPayloadIdentity as serverFileImpactPayloadIdentity };
export { isServerFileImpact as isServerFileImpact };
export { serverFileImpact as serverFileImpact };
export { serverFileImpactService as serverFileImpactService };
const uaOpenWindowPayloadIdentity = "uaOpenWindow";
function isUserAgentOpenWindow(o5) {
    if (isIdentifiablePayload(o5)) {
        if (o5.payloadIdentity == uaOpenWindowPayloadIdentity) {
            return true;
        }
    }
    return false;
}
function userAgentOpenWindow(sfi) {
    return {
        payloadIdentity: uaOpenWindowPayloadIdentity,
        ...sfi
    };
}
function userAgentOpenWindowService() {
    const service = {
        serviceIdentity: uaOpenWindowPayloadIdentity,
        payloadIdentity: uaOpenWindowPayloadIdentity,
        isEventSourcePayload: (rawJSON)=>{
            return isUserAgentOpenWindow(rawJSON);
        },
        prepareEventSourcePayload: (rawJSON)=>{
            return rawJSON;
        },
        isWebSocketReceivePayload: (_rawJSON)=>true
        ,
        prepareWebSocketReceivePayload: (rawJSON)=>{
            const validated = rawJSON;
            validated.isValidatedPayload = true;
            validated.isValidPayload = true;
            return validated;
        }
    };
    return service;
}
export { uaOpenWindowPayloadIdentity as uaOpenWindowPayloadIdentity };
export { isUserAgentOpenWindow as isUserAgentOpenWindow };
export { userAgentOpenWindow as userAgentOpenWindow };
export { userAgentOpenWindowService as userAgentOpenWindowService };
(()=>{
    var L1 = (t1, i1)=>()=>(i1 || (i1 = {
                exports: {}
            }, t1(i1.exports, i1)), i1.exports)
    , b1 = L1((W, v1)=>{
        v1.exports = [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            39,
            43,
            50,
            90,
            70,
            120,
            80,
            30,
            50,
            50,
            70,
            90,
            40,
            50,
            40,
            50,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            50,
            50,
            90,
            90,
            90,
            60,
            110,
            75,
            75,
            77,
            85,
            70,
            63,
            85,
            83,
            46,
            50,
            76,
            61,
            93,
            82,
            87,
            66,
            87,
            76,
            75,
            68,
            81,
            75,
            110,
            75,
            68,
            75,
            50,
            50,
            50,
            90,
            70,
            70,
            66,
            69,
            57,
            69,
            66,
            39,
            69,
            70,
            30,
            38,
            65,
            30,
            110,
            70,
            67,
            69,
            69,
            47,
            57,
            43,
            70,
            65,
            90,
            65,
            65,
            58,
            70,
            50,
            70,
            90,
            0,
            61,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            55,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            55,
            110,
            39,
            43,
            70,
            70,
            70,
            70,
            50,
            70,
            70,
            110,
            60,
            71,
            90,
            0,
            110,
            70,
            60,
            90,
            60,
            60,
            70,
            71,
            70,
            40,
            70,
            60,
            60,
            71,
            110,
            110,
            110,
            60,
            75,
            75,
            75,
            75,
            75,
            75,
            110,
            77,
            70,
            70,
            70,
            70,
            46,
            46,
            46,
            46,
            85,
            82,
            87,
            87,
            87,
            87,
            87,
            90,
            87,
            81,
            81,
            81,
            81,
            68,
            67,
            68,
            66,
            66,
            66,
            66,
            66,
            66,
            110,
            57,
            66,
            66,
            66,
            66,
            30,
            30,
            30,
            30,
            67,
            70,
            67,
            67,
            67,
            67,
            67,
            90,
            67,
            70,
            70,
            70,
            70,
            65,
            69,
            65,
            75,
            66,
            75,
            66,
            75,
            66,
            77,
            57,
            77,
            57,
            77,
            57,
            77,
            57,
            85,
            71,
            85,
            69,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            85,
            69,
            85,
            69,
            85,
            69,
            85,
            69,
            83,
            70,
            83,
            70,
            46,
            30,
            46,
            30,
            46,
            30,
            46,
            30,
            46,
            30,
            96,
            68,
            50,
            38,
            76,
            65,
            65,
            61,
            30,
            61,
            30,
            61,
            33,
            61,
            50,
            62,
            31,
            82,
            70,
            82,
            70,
            82,
            70,
            80,
            82,
            70,
            87,
            67,
            87,
            67,
            87,
            67,
            120,
            110,
            76,
            47,
            76,
            47,
            76,
            47,
            75,
            57,
            75,
            57,
            75,
            57,
            75,
            57,
            68,
            43,
            68,
            43,
            68,
            43,
            81,
            70,
            81,
            70,
            81,
            69,
            81,
            70,
            81,
            70,
            81,
            69,
            110,
            90,
            68,
            65,
            68,
            75,
            58,
            75,
            58,
            75,
            58,
            33,
            69,
            77,
            64,
            69,
            75,
            62,
            76,
            76,
            59,
            83,
            96,
            64,
            69,
            65,
            60,
            83,
            58,
            59,
            70,
            79,
            72,
            100,
            43,
            43,
            73,
            64,
            42,
            65,
            120,
            81,
            68,
            86,
            89,
            67,
            120,
            98,
            74,
            69,
            70,
            59,
            56,
            65,
            58,
            41,
            74,
            41,
            70,
            83,
            73,
            86,
            78,
            68,
            74,
            67,
            63,
            61,
            61,
            56,
            57,
            70,
            70,
            52,
            50,
            67,
            29,
            48,
            50,
            32,
            140,
            140,
            130,
            94,
            90,
            61,
            110,
            110,
            99,
            76,
            61,
            32,
            32,
            85,
            68,
            76,
            68,
            76,
            68,
            81,
            70,
            76,
            68,
            81,
            70,
            61,
            76,
            61,
            76,
            61,
            100,
            94,
            88,
            69,
            79,
            69,
            72,
            64,
            85,
            68,
            85,
            68,
            61,
            56,
            28,
            140,
            140,
            130,
            85,
            69,
            110,
            61,
            82,
            70,
            75,
            66,
            110,
            110,
            87,
            67,
            72,
            60,
            76,
            61,
            63,
            58,
            60,
            61,
            30,
            27,
            32,
            32,
            76,
            63,
            85,
            68,
            68,
            37,
            70,
            45,
            71,
            61,
            76,
            68,
            75,
            57,
            68,
            43,
            58,
            55,
            81,
            68,
            81,
            100,
            85,
            68,
            67,
            63,
            76,
            61,
            60,
            61,
            85,
            68,
            85,
            68,
            85,
            68,
            85,
            68,
            69,
            57,
            63,
            100,
            63,
            28,
            100,
            100,
            75,
            81,
            56,
            62,
            68,
            55,
            55,
            62,
            62,
            81,
            95,
            75,
            75,
            62,
            61,
            25,
            96,
            69,
            87,
            44,
            86,
            69,
            61,
            69,
            69,
            69,
            56,
            61,
            70,
            70,
            61,
            66,
            86,
            51,
            51,
            71,
            64,
            45,
            70,
            69,
            65,
            59,
            65,
            68,
            68,
            68,
            42,
            41,
            45,
            56,
            53,
            33,
            72,
            100,
            100,
            100,
            69,
            70,
            69,
            68,
            89,
            86,
            84,
            45,
            45,
            47,
            45,
            45,
            45,
            45,
            61,
            61,
            56,
            47,
            48,
            53,
            59,
            41,
            41,
            72,
            73,
            68,
            57,
            85,
            57,
            53,
            63,
            77,
            56,
            59,
            49,
            49,
            49,
            53,
            85,
            58,
            65,
            67,
            69,
            53,
            64,
            51,
            70,
            50,
            49,
            110,
            110,
            130,
            88,
            78,
            96,
            110,
            74,
            77,
            68,
            64,
            71,
            71,
            40,
            40,
            26,
            27,
            27,
            35,
            35,
            51,
            36,
            26,
            52,
            35,
            22,
            28,
            29,
            29,
            31,
            31,
            38,
            39,
            40,
            40,
            70,
            70,
            20,
            70,
            31,
            31,
            20,
            40,
            31,
            31,
            42,
            42,
            31,
            31,
            50,
            50,
            50,
            50,
            70,
            70,
            70,
            70,
            70,
            70,
            23,
            38,
            41,
            20,
            35,
            40,
            31,
            43,
            43,
            43,
            43,
            43,
            42,
            42,
            37,
            46,
            48,
            24,
            24,
            26,
            26,
            32,
            31,
            47,
            47,
            41,
            27,
            31,
            31,
            31,
            31,
            42,
            42,
            50,
            0,
            0,
            53,
            0,
            51,
            68,
            52,
            39,
            49,
            0,
            46,
            51,
            53,
            38,
            47,
            0,
            52,
            52,
            39,
            39,
            39,
            11,
            46,
            47,
            44,
            44,
            26,
            17,
            41,
            48,
            48,
            48,
            48,
            25,
            25,
            0,
            49,
            46,
            21,
            40,
            41,
            38,
            40,
            57,
            53,
            53,
            52,
            52,
            52,
            51,
            68,
            68,
            62,
            62,
            68,
            62,
            79,
            41,
            0,
            40,
            57,
            48,
            41,
            68,
            0,
            0,
            52,
            42,
            53,
            38,
            40,
            51,
            47,
            45,
            52,
            52,
            52,
            57,
            44,
            0,
            45,
            41,
            52,
            48,
            45,
            45,
            56,
            41,
            20,
            48,
            51,
            47,
            83,
            52,
            51,
            51,
            51,
            51,
            51,
            45,
            44,
            36,
            45,
            44,
            44,
            45,
            44,
            51,
            40,
            41,
            45,
            45,
            46,
            37,
            65,
            51,
            32,
            32,
            79,
            64,
            79,
            79,
            68,
            56,
            56,
            56,
            50,
            66,
            79,
            79,
            79,
            79,
            70,
            70,
            75,
            50,
            83,
            96,
            59,
            79,
            97,
            79,
            83,
            100,
            30,
            75,
            75,
            62,
            77,
            70,
            75,
            83,
            87,
            46,
            76,
            75,
            93,
            82,
            71,
            87,
            83,
            66,
            79,
            74,
            68,
            68,
            90,
            75,
            96,
            90,
            46,
            68,
            69,
            56,
            70,
            30,
            69,
            69,
            68,
            65,
            67,
            56,
            50,
            70,
            69,
            30,
            65,
            65,
            70,
            65,
            55,
            67,
            70,
            69,
            56,
            69,
            55,
            69,
            87,
            65,
            90,
            89,
            30,
            69,
            67,
            69,
            89,
            62,
            57,
            64,
            59,
            59,
            70,
            85,
            86,
            61,
            85,
            68,
            73,
            59,
            59,
            56,
            60,
            56,
            73,
            88,
            98,
            92,
            74,
            61,
            74,
            55,
            73,
            73,
            67,
            66,
            81,
            61,
            51,
            45,
            61,
            67,
            56,
            33,
            86,
            58,
            58,
            63,
            67,
            76,
            95,
            80,
            78,
            81,
            81,
            81,
            70,
            70,
            87,
            62,
            77,
            75,
            46,
            46,
            50,
            120,
            120,
            90,
            76,
            83,
            68,
            83,
            75,
            75,
            75,
            62,
            82,
            70,
            110,
            68,
            83,
            83,
            76,
            81,
            93,
            83,
            87,
            83,
            66,
            77,
            68,
            68,
            90,
            75,
            84,
            78,
            110,
            110,
            86,
            100,
            75,
            77,
            110,
            78,
            66,
            68,
            65,
            52,
            68,
            66,
            88,
            58,
            70,
            70,
            65,
            68,
            77,
            70,
            67,
            70,
            69,
            59,
            55,
            65,
            92,
            65,
            71,
            67,
            96,
            98,
            70,
            87,
            63,
            60,
            92,
            66,
            66,
            66,
            70,
            52,
            60,
            57,
            30,
            30,
            38,
            100,
            100,
            70,
            65,
            70,
            65,
            70,
            97,
            85,
            69,
            60,
            99,
            82,
            66,
            59,
            97,
            83,
            94,
            81,
            120,
            110,
            57,
            53,
            76,
            77,
            75,
            63,
            69,
            55,
            69,
            55,
            130,
            110,
            75,
            62,
            96,
            84,
            97,
            85,
            71,
            59,
            69,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            78,
            63,
            69,
            60,
            70,
            62,
            62,
            52,
            62,
            52,
            67,
            55,
            110,
            88,
            65,
            56,
            76,
            65,
            76,
            65,
            72,
            57,
            90,
            76,
            83,
            70,
            110,
            78,
            110,
            96,
            82,
            66,
            72,
            58,
            66,
            53,
            68,
            65,
            68,
            65,
            75,
            65,
            99,
            74,
            75,
            60,
            78,
            67,
            78,
            70,
            85,
            65,
            85,
            65,
            30,
            100,
            84,
            69,
            60,
            78,
            64,
            78,
            62,
            78,
            63,
            75,
            60,
            96,
            82,
            30,
            72,
            60,
            72,
            60,
            100,
            93,
            63,
            58,
            83,
            66,
            76,
            58,
            100,
            84,
            65,
            56,
            64,
            64,
            78,
            63,
            78,
            63,
            76,
            63,
            87,
            67,
            75,
            63,
            74,
            59,
            69,
            52,
            69,
            52,
            69,
            52,
            75,
            60,
            61,
            46,
            95,
            85,
            65,
            45,
            69,
            55,
            69,
            55,
            68,
            62,
            90,
            95,
            87,
            71,
            59,
            55,
            110,
            89,
            110,
            91,
            68,
            57,
            78,
            70,
            74,
            59,
            78,
            64,
            84,
            76,
            91,
            75,
            110,
            81,
            85,
            68,
            100,
            87,
            75,
            69,
            110,
            88,
            120,
            100,
            76,
            66,
            74,
            68,
            49,
            44,
            98,
            89,
            62,
            58,
            73,
            65,
            79,
            84,
            63,
            81,
            81,
            68,
            71,
            63,
            60,
            80,
            75,
            64,
            57,
            80,
            72,
            66,
            65,
            77,
            79,
            68,
            80,
            61,
            81,
            70,
            59,
            66,
            73,
            67,
            81,
            68,
            81,
            61,
            54,
            63,
            69,
            75,
            69,
            64,
            77,
            79,
            79,
            44,
            37,
            33,
            42,
            29,
            38,
            0,
            79,
            82,
            56,
            67,
            70,
            55,
            58,
            52,
            56,
            63,
            63,
            55,
            30,
            84,
            58,
            54,
            55,
            51,
            57,
            58,
            58,
            30,
            56,
            48,
            58,
            45,
            81,
            48,
            67,
            58,
            58,
            83,
            70,
            56,
            43,
            81,
            65,
            55,
            69,
            59,
            79,
            39,
            44,
            79,
            79,
            79,
            79,
            88,
            79,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            11,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            14,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            3.3,
            15,
            0,
            0,
            0,
            38,
            0,
            28,
            0,
            0,
            28,
            0,
            5,
            44,
            12,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            71,
            62,
            47,
            55,
            78,
            35,
            37,
            78,
            71,
            35,
            58,
            63,
            59,
            77,
            76,
            34,
            45,
            73,
            66,
            58,
            63,
            53,
            63,
            73,
            56,
            79,
            76,
            79,
            79,
            79,
            79,
            79,
            68,
            68,
            66,
            31,
            53,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            97,
            190,
            93,
            81,
            290,
            120,
            71,
            71,
            86,
            58,
            58,
            53,
            32,
            49,
            93,
            58,
            0,
            0,
            0.9,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            9,
            32,
            0,
            79,
            27,
            39,
            89,
            35,
            32,
            32,
            43,
            32,
            70,
            32,
            70,
            39,
            70,
            70,
            64,
            64,
            64,
            45,
            45,
            45,
            45,
            100,
            100,
            120,
            120,
            66,
            66,
            64,
            64,
            77,
            77,
            70,
            70,
            70,
            22,
            86,
            60,
            60,
            52,
            45,
            59,
            39,
            43,
            70,
            70,
            0,
            0.2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            57,
            70,
            60,
            0,
            32,
            32,
            32,
            0,
            47,
            58,
            54,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            64,
            64,
            64,
            64,
            64,
            64,
            64,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            45,
            100,
            100,
            100,
            120,
            120,
            66,
            64,
            86,
            86,
            86,
            86,
            86,
            86,
            60,
            60,
            77,
            77,
            77,
            60,
            60,
            60,
            77,
            77,
            77,
            77,
            77,
            77,
            52,
            52,
            52,
            52,
            59,
            59,
            59,
            59,
            59,
            57,
            64,
            39,
            49,
            49,
            49,
            43,
            43,
            43,
            43,
            43,
            43,
            43,
            43,
            70,
            79,
            70,
            43,
            70,
            70,
            64,
            64,
            35,
            39,
            7,
            4.1,
            0.45,
            0.099,
            0,
            0,
            0,
            95,
            61,
            0,
            0,
            0,
            0,
            24,
            0,
            25,
            38,
            0,
            0,
            70,
            0,
            0,
            0,
            0,
            45,
            45,
            51,
            51,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            58,
            100,
            120,
            64,
            51,
            48,
            57,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            64,
            64,
            45,
            45,
            45,
            100,
            64,
            64,
            64,
            86,
            86,
            77,
            77,
            77,
            45,
            45,
            59,
            59,
            59,
            52,
            45,
            45,
            100,
            64,
            64,
            100,
            45,
            64,
            32,
            32,
            70,
            70,
            70,
            43,
            43,
            64,
            64,
            64,
            100,
            100,
            60,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            96,
            96,
            74,
            84,
            100,
            74,
            70,
            54,
            83,
            83,
            61,
            47,
            64,
            26,
            52,
            120,
            92,
            52,
            37,
            73,
            88,
            79,
            96,
            96,
            96,
            38,
            83,
            100,
            74,
            66,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            58,
            40,
            41,
            34,
            33,
            79,
            79,
            79,
            79,
            79,
            79,
            56,
            62,
            79,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            79,
            0,
            0,
            0,
            0,
            0,
            73,
            73,
            73,
            100,
            80,
            80,
            110,
            58,
            58,
            52,
            74,
            91,
            79,
            60,
            60,
            60,
            60,
            110,
            110,
            110,
            110,
            85,
            87,
            61,
            70,
            68,
            71,
            75,
            82,
            85,
            77,
            55,
            63,
            60,
            58,
            83,
            61,
            71,
            58,
            70,
            56,
            56,
            62,
            87,
            62,
            64,
            64,
            67,
            44,
            45,
            78,
            81,
            81,
            60,
            79,
            63,
            75,
            56,
            73,
            100,
            73,
            54,
            100,
            100,
            100,
            73,
            73,
            73,
            73,
            73,
            73,
            73,
            73,
            100,
            100,
            100,
            100,
            73,
            100,
            100,
            130,
            0,
            0,
            73,
            73,
            73,
            73,
            73,
            85,
            87,
            61,
            82,
            60,
            58,
            87,
            67,
            91,
            79,
            73,
            73,
            52,
            82,
            51,
            53,
            54,
            54,
            56,
            59,
            58,
            72,
            53,
            52,
            55,
            34,
            80,
            80,
            110,
            110,
            80,
            80,
            57,
            82,
            67,
            61,
            80,
            50,
            61,
            62,
            62,
            73,
            120,
            120,
            79,
            98,
            130,
            54,
            72,
            73,
            75,
            83,
            68,
            79,
            79,
            78,
            83,
            79,
            79,
            66,
            78,
            76,
            72,
            70,
            69,
            76,
            58,
            65,
            88,
            85,
            100,
            60,
            60,
            73,
            60,
            67,
            75,
            74,
            60,
            67,
            69,
            79,
            72,
            83,
            60,
            79,
            64,
            62,
            60,
            79,
            81,
            79,
            79,
            79,
            77,
            62,
            72,
            54,
            79,
            79,
            73,
            51,
            100,
            100,
            100,
            73,
            73,
            73,
            73,
            79,
            79,
            100,
            100,
            79,
            79,
            130,
            130,
            73,
            57,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            100,
            79,
            79,
            79,
            79,
            73,
            60,
            79,
            62,
            83,
            68,
            73,
            73,
            79,
            79,
            65,
            58,
            53,
            80,
            55,
            67,
            70,
            62,
            76,
            69,
            61,
            60,
            46,
            66,
            44,
            75,
            70,
            30,
            62,
            58,
            70,
            30,
            79,
            79,
            79,
            79,
            79,
            34,
            23,
            32,
            79,
            89,
            110,
            97,
            98,
            78,
            78,
            79,
            79,
            79,
            79,
            73,
            89,
            79,
            79,
            78,
            89,
            76,
            76,
            90,
            92,
            75,
            76,
            79,
            76,
            79,
            73,
            73,
            79,
            75,
            76,
            78,
            75,
            76,
            76,
            76,
            79,
            79,
            76,
            75,
            77,
            75,
            75,
            91,
            73,
            79,
            78,
            78,
            79,
            76,
            75,
            79,
            75,
            73,
            79,
            79,
            12,
            79,
            26,
            23,
            50,
            64,
            64,
            79,
            79,
            79,
            79,
            62,
            62,
            79,
            79,
            67,
            58,
            19,
            79,
            79,
            79,
            19,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            76,
            90,
            76,
            75,
            79,
            75,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            93,
            68,
            69,
            70,
            77,
            76,
            70,
            70,
            80,
            77,
            36,
            26,
            73,
            78,
            170,
            46,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            89,
            89,
            28,
            79,
            94,
            120,
            71,
            78,
            82,
            95,
            88,
            83,
            94,
            79,
            94,
            94,
            120,
            79,
            120,
            120,
            63,
            84,
            79,
            70,
            65,
            74,
            86,
            92,
            92,
            76,
            70,
            79,
            63,
            76,
            98,
            71,
            74,
            63,
            71,
            73,
            79,
            74,
            63,
            85,
            89,
            67,
            74,
            56,
            79,
            74,
            90,
            79,
            74,
            79,
            74,
            81,
            65,
            79,
            79,
            89,
            56,
            120,
            100,
            120,
            89,
            89,
            89,
            89,
            89,
            79,
            89,
            89,
            120,
            79,
            120,
            120,
            89,
            79,
            79,
            120,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            95,
            83,
            89,
            89,
            79,
            79,
            74,
            46,
            56,
            62,
            72,
            74,
            57,
            85,
            59,
            75,
            47,
            100,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            28,
            46,
            48,
            79,
            84,
            100,
            88,
            90,
            91,
            90,
            90,
            62,
            79,
            79,
            70,
            91,
            79,
            79,
            75,
            95,
            87,
            84,
            84,
            84,
            94,
            83,
            70,
            87,
            84,
            79,
            84,
            85,
            84,
            84,
            79,
            84,
            74,
            85,
            73,
            79,
            79,
            75,
            94,
            85,
            88,
            75,
            82,
            87,
            79,
            87,
            87,
            79,
            85,
            80,
            75,
            75,
            85,
            79,
            79,
            4.7,
            50,
            98,
            78,
            98,
            78,
            78,
            78,
            78,
            79,
            79,
            140,
            140,
            79,
            79,
            150,
            150,
            78,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            78,
            98,
            79,
            79,
            79,
            79,
            84,
            84,
            79,
            90,
            89,
            64,
            78,
            78,
            79,
            79,
            67,
            56,
            56,
            91,
            69,
            59,
            70,
            62,
            55,
            61,
            81,
            63,
            19,
            44,
            70,
            57,
            81,
            91,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            62,
            76,
            79,
            98,
            120,
            100,
            69,
            100,
            120,
            79,
            79,
            79,
            78,
            78,
            86,
            79,
            83,
            83,
            170,
            78,
            79,
            79,
            79,
            91,
            71,
            79,
            83,
            79,
            100,
            85,
            79,
            79,
            79,
            140,
            75,
            79,
            79,
            79,
            74,
            100,
            64,
            79,
            79,
            79,
            73,
            76,
            59,
            70,
            88,
            93,
            73,
            80,
            100,
            100,
            110,
            130,
            79,
            79,
            79,
            79,
            120,
            80,
            64,
            110,
            120,
            79,
            79,
            79,
            140,
            130,
            160,
            79,
            190,
            180,
            230,
            62,
            79,
            79,
            92,
            79,
            79,
            79,
            79,
            79,
            79,
            150,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            36,
            55,
            59,
            69,
            69,
            65,
            66,
            81,
            91,
            70,
            95,
            90,
            78,
            76,
            85,
            91,
            80,
            160,
            81,
            130,
            140,
            81,
            110,
            79,
            79,
            79,
            79,
            79,
            73,
            110,
            140,
            110,
            79,
            97,
            94,
            85,
            110,
            99,
            130,
            160,
            110,
            79,
            84,
            84,
            89,
            79,
            83,
            83,
            85,
            57,
            99,
            66,
            120,
            85,
            88,
            88,
            84,
            140,
            110,
            93,
            68,
            90,
            90,
            92,
            90,
            90,
            90,
            90,
            84,
            79,
            84,
            84,
            90,
            90,
            120,
            140,
            68,
            97,
            85,
            71,
            97,
            84,
            61,
            84,
            84,
            120,
            79,
            79,
            79,
            70,
            110,
            73,
            73,
            110,
            140,
            120,
            150,
            79,
            73,
            73,
            73,
            79,
            73,
            73,
            110,
            73,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            73,
            73,
            79,
            88,
            84,
            90,
            79,
            79,
            79,
            79,
            79,
            200,
            150,
            73,
            73,
            79,
            79,
            64,
            62,
            77,
            55,
            65,
            71,
            50,
            57,
            65,
            50,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            58,
            28,
            52,
            82,
            74,
            74,
            73,
            86,
            42,
            61,
            120,
            93,
            79,
            90,
            85,
            92,
            120,
            120,
            140,
            120,
            110,
            79,
            81,
            81,
            84,
            79,
            81,
            81,
            84,
            68,
            94,
            70,
            87,
            81,
            81,
            95,
            81,
            140,
            120,
            85,
            73,
            82,
            82,
            85,
            81,
            88,
            88,
            88,
            80,
            79,
            81,
            81,
            86,
            86,
            120,
            140,
            73,
            90,
            90,
            83,
            79,
            83,
            72,
            81,
            83,
            87,
            79,
            79,
            61,
            52,
            120,
            71,
            110,
            100,
            130,
            89,
            130,
            79,
            74,
            110,
            120,
            79,
            140,
            180,
            110,
            110,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            97,
            89,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            90,
            79,
            150,
            150,
            69,
            80,
            79,
            79,
            72,
            67,
            85,
            83,
            83,
            92,
            85,
            82,
            99,
            67,
            79,
            59,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            42,
            31,
            79,
            140,
            150,
            99,
            180,
            70,
            150,
            88,
            110,
            79,
            120,
            120,
            180,
            79,
            70,
            120,
            150,
            97,
            88,
            83,
            130,
            110,
            91,
            130,
            88,
            160,
            140,
            57,
            64,
            120,
            120,
            140,
            96,
            81,
            61,
            92,
            92,
            100,
            78,
            110,
            130,
            64,
            64,
            97,
            67,
            63,
            84,
            72,
            63,
            88,
            94,
            110,
            120,
            120,
            81,
            79,
            79,
            42,
            110,
            89,
            88,
            96,
            96,
            100,
            100,
            79,
            130,
            120,
            180,
            79,
            170,
            160,
            200,
            66,
            19,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            150,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            88,
            120,
            70,
            81,
            79,
            79,
            64,
            86,
            88,
            110,
            68,
            97,
            130,
            48,
            88,
            100,
            92,
            96,
            130,
            76,
            82,
            110,
            79,
            79,
            79,
            120,
            150,
            100,
            68,
            110,
            94,
            110,
            79,
            79,
            68,
            48,
            79,
            91,
            130,
            130,
            130,
            92,
            90,
            95,
            150,
            150,
            200,
            110,
            170,
            100,
            110,
            160,
            100,
            100,
            170,
            79,
            79,
            79,
            120,
            110,
            100,
            94,
            110,
            120,
            100,
            90,
            88,
            180,
            170,
            150,
            100,
            95,
            100,
            110,
            100,
            140,
            130,
            110,
            96,
            83,
            110,
            100,
            79,
            100,
            88,
            100,
            110,
            120,
            110,
            100,
            99,
            88,
            79,
            99,
            79,
            79,
            97,
            110,
            88,
            100,
            120,
            110,
            100,
            79,
            79,
            79,
            86,
            79,
            79,
            79,
            79,
            120,
            130,
            130,
            89,
            89,
            89,
            79,
            89,
            79,
            140,
            160,
            160,
            220,
            190,
            190,
            220,
            150,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            200,
            63,
            160,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            21,
            66,
            63,
            63,
            70,
            69,
            70,
            52,
            58,
            67,
            64,
            65,
            90,
            90,
            73,
            73,
            59,
            76,
            94,
            90,
            69,
            69,
            66,
            69,
            61,
            68,
            72,
            72,
            65,
            65,
            74,
            74,
            73,
            69,
            67,
            53,
            66,
            64,
            73,
            56,
            69,
            71,
            66,
            69,
            74,
            64,
            63,
            68,
            48,
            56,
            56,
            110,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            79,
            79,
            79,
            79,
            75,
            35,
            64,
            56,
            61,
            46,
            57,
            67,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            81,
            64,
            68,
            72,
            75,
            68,
            66,
            64,
            84,
            68,
            73,
            85,
            140,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            68,
            60,
            79,
            62,
            79,
            79,
            56,
            61,
            79,
            60,
            79,
            79,
            62,
            79,
            79,
            79,
            79,
            79,
            79,
            64,
            66,
            69,
            71,
            79,
            68,
            58,
            58,
            74,
            73,
            73,
            74,
            79,
            68,
            61,
            60,
            79,
            61,
            79,
            59,
            79,
            79,
            61,
            84,
            79,
            61,
            61,
            58,
            56,
            0,
            47,
            47,
            0,
            0,
            0,
            0,
            0,
            0,
            79,
            0,
            0,
            54,
            79,
            79,
            38,
            65,
            37,
            37,
            37,
            79,
            65,
            79,
            0,
            0,
            0,
            0,
            36,
            0,
            79,
            79,
            61,
            56,
            55,
            63,
            56,
            58,
            69,
            69,
            73,
            69,
            79,
            79,
            110,
            110,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            69,
            54,
            85,
            85,
            130,
            66,
            130,
            160,
            42,
            63,
            71,
            18,
            18,
            27,
            50,
            27,
            27,
            34,
            120,
            65,
            40,
            71,
            52,
            83,
            45,
            37,
            32,
            55,
            55,
            34,
            55,
            58,
            38,
            38,
            60,
            57,
            76,
            55,
            63,
            63,
            52,
            56,
            56,
            60,
            57,
            76,
            55,
            63,
            63,
            56,
            56,
            55,
            58,
            41,
            55,
            33,
            60,
            6.3,
            150,
            150,
            54,
            54,
            31,
            47,
            57,
            57,
            57,
            56,
            52,
            59,
            57,
            52,
            79,
            51,
            52,
            52,
            52,
            56,
            52,
            52,
            52,
            52,
            56,
            52,
            57,
            57,
            57,
            56,
            57,
            59,
            57,
            52,
            56,
            52,
            52,
            54,
            52,
            62,
            54,
            59,
            57,
            57,
            57,
            52,
            66,
            56,
            54,
            58,
            58,
            79,
            79,
            79,
            79,
            60,
            55,
            60,
            61,
            120,
            56,
            120,
            56,
            120,
            53,
            54,
            57,
            57,
            22,
            51,
            54,
            60,
            41,
            41,
            15,
            57,
            41,
            37,
            0,
            58,
            52,
            58,
            79,
            79,
            79,
            79,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            79,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            59,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            56,
            79,
            56,
            56,
            64,
            43,
            54,
            65,
            45,
            36,
            50,
            71,
            39,
            61,
            66,
            64,
            68,
            79,
            70,
            55,
            220,
            52,
            23,
            130,
            53,
            70,
            72,
            67,
            70,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            120,
            66,
            68,
            120,
            66,
            68,
            120,
            66,
            84,
            110,
            120,
            75,
            66,
            75,
            68,
            130,
            120,
            120,
            63,
            68,
            69,
            68,
            68,
            68,
            120,
            68,
            120,
            67,
            120,
            68,
            120,
            120,
            66,
            110,
            79,
            120,
            130,
            66,
            66,
            65,
            79,
            130,
            240,
            79,
            120,
            65,
            65,
            65,
            65,
            120,
            65,
            79,
            79,
            79,
            65,
            65,
            90,
            68,
            65,
            76,
            81,
            65,
            65,
            170,
            68,
            66,
            66,
            66,
            66,
            66,
            68,
            68,
            68,
            68,
            23,
            43,
            66,
            81,
            66,
            97,
            68,
            68,
            68,
            68,
            66,
            94,
            120,
            170,
            65,
            65,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            73,
            74,
            78,
            77,
            67,
            87,
            73,
            86,
            62,
            70,
            86,
            77,
            69,
            75,
            78,
            76,
            81,
            68,
            65,
            75,
            75,
            78,
            71,
            69,
            69,
            69,
            70,
            85,
            65,
            73,
            69,
            74,
            81,
            63,
            67,
            67,
            74,
            87,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            51,
            63,
            64,
            100,
            56,
            60,
            80,
            110,
            65,
            53,
            130,
            55,
            56,
            95,
            57,
            59,
            91,
            54,
            85,
            92,
            86,
            56,
            88,
            51,
            58,
            53,
            62,
            56,
            56,
            63,
            55,
            87,
            52,
            74,
            63,
            60,
            54,
            60,
            93,
            66,
            66,
            66,
            66,
            59,
            66,
            79,
            79,
            79,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            79,
            79,
            79,
            79,
            79,
            0,
            0,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            95,
            110,
            110,
            110,
            95,
            79,
            79,
            79,
            79,
            79,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            95,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            79,
            79,
            79,
            79,
            79,
            79,
            76,
            99,
            71,
            73,
            72,
            80,
            99,
            120,
            71,
            91,
            91,
            71,
            94,
            81,
            120,
            95,
            110,
            130,
            130,
            110,
            130,
            110,
            110,
            130,
            120,
            150,
            130,
            120,
            130,
            120,
            120,
            130,
            110,
            130,
            110,
            110,
            110,
            120,
            110,
            110,
            67,
            78,
            76,
            99,
            92,
            68,
            90,
            99,
            74,
            97,
            97,
            74,
            96,
            74,
            74,
            97,
            84,
            100,
            100,
            84,
            100,
            88,
            84,
            100,
            94,
            94,
            94,
            94,
            94,
            94,
            94,
            94,
            110,
            79,
            130,
            94,
            94,
            130,
            79,
            79,
            97,
            97,
            97,
            97,
            97,
            110,
            97,
            79,
            110,
            79,
            140,
            97,
            97,
            120,
            79,
            79,
            78,
            99,
            99,
            78,
            98,
            100,
            78,
            99,
            84,
            100,
            100,
            84,
            100,
            100,
            84,
            100,
            85,
            85,
            85,
            86,
            86,
            85,
            85,
            85,
            85,
            86,
            85,
            86,
            85,
            100,
            87,
            85,
            76,
            95,
            90,
            76,
            89,
            74,
            110,
            110,
            110,
            79,
            110,
            83,
            89,
            110,
            79,
            79,
            58,
            77,
            72,
            70,
            71,
            75,
            87,
            81,
            83,
            96,
            91,
            83,
            89,
            83,
            100,
            86,
            70,
            95,
            95,
            70,
            94,
            72,
            71,
            87,
            79,
            100,
            100,
            79,
            100,
            79,
            79,
            99,
            120,
            79,
            110,
            95,
            100,
            110,
            79,
            79,
            98,
            120,
            120,
            98,
            120,
            98,
            98,
            79,
            140,
            79,
            130,
            120,
            120,
            130,
            79,
            79,
            100,
            120,
            100,
            100,
            100,
            130,
            100,
            130,
            74,
            98,
            95,
            72,
            95,
            72,
            78,
            79,
            82,
            100,
            100,
            82,
            100,
            99,
            82,
            100,
            120,
            120,
            120,
            120,
            120,
            140,
            120,
            120,
            64,
            80,
            91,
            65,
            100,
            77,
            90,
            110,
            84,
            110,
            110,
            82,
            100,
            93,
            91,
            110,
            84,
            110,
            100,
            78,
            100,
            99,
            91,
            100,
            85,
            110,
            110,
            84,
            110,
            100,
            92,
            110,
            64,
            92,
            67,
            70,
            66,
            88,
            64,
            79,
            110,
            79,
            100,
            69,
            81,
            100,
            79,
            79,
            81,
            100,
            81,
            81,
            81,
            97,
            87,
            81,
            120,
            140,
            140,
            120,
            140,
            120,
            120,
            140,
            150,
            150,
            150,
            150,
            180,
            150,
            150,
            150,
            73,
            97,
            95,
            72,
            95,
            93,
            74,
            95,
            76,
            98,
            97,
            73,
            96,
            95,
            77,
            95,
            74,
            98,
            76,
            67,
            76,
            72,
            77,
            91,
            94,
            95,
            100,
            95,
            110,
            92,
            94,
            92,
            85,
            86,
            85,
            86,
            85,
            85,
            85,
            85,
            89,
            130,
            100,
            79,
            79,
            79,
            79,
            78,
            100,
            33,
            68,
            39,
            39,
            39,
            55,
            33,
            100,
            61,
            56,
            59,
            60,
            72,
            66,
            67,
            71,
            62,
            46,
            82,
            82,
            96,
            60,
            71,
            87,
            90,
            58,
            62,
            110,
            79,
            79,
            79,
            170,
            160,
            130,
            170,
            120,
            110,
            98,
            140,
            110,
            110,
            120,
            140,
            110,
            97,
            86,
            120,
            32,
            60,
            32,
            32,
            60,
            76,
            51,
            99,
            110,
            56,
            79,
            79,
            79,
            79,
            79,
            79,
            81,
            74,
            71,
            77,
            110,
            41,
            70,
            80,
            59,
            69,
            81,
            54,
            66,
            100,
            68,
            97,
            50,
            62,
            120,
            100,
            70,
            66,
            80,
            99,
            57,
            91,
            90,
            91,
            68,
            78,
            83,
            59,
            83,
            100,
            73,
            63,
            68,
            88,
            72,
            130,
            89,
            100,
            110,
            57,
            87,
            120,
            63,
            71,
            56,
            72,
            74,
            54,
            100,
            63,
            76,
            84,
            84,
            81,
            58,
            92,
            78,
            67,
            67,
            76,
            73,
            95,
            62,
            76,
            91,
            80,
            80,
            71,
            86,
            90,
            120,
            83,
            94,
            63,
            63,
            130,
            74,
            88,
            73,
            88,
            68,
            79,
            79,
            79,
            56,
            67,
            46,
            74,
            50,
            79,
            79,
            79,
            79,
            87,
            87,
            87,
            87,
            82,
            82,
            82,
            82,
            82,
            82,
            82,
            88,
            88,
            88,
            88,
            88,
            88,
            97,
            100,
            97,
            100,
            82,
            100,
            97,
            100,
            97,
            82,
            73,
            65,
            54,
            35,
            35,
            50,
            50,
            38,
            53,
            55,
            35,
            23,
            44,
            45,
            44,
            120,
            98,
            110,
            120,
            91,
            91,
            91,
            91,
            84,
            84,
            84,
            84,
            84,
            84,
            84,
            92,
            92,
            92,
            94,
            92,
            91,
            95,
            100,
            95,
            100,
            100,
            95,
            100,
            95,
            84,
            46,
            15,
            40,
            90,
            90,
            90,
            90,
            77,
            77,
            77,
            77,
            77,
            77,
            77,
            110,
            100,
            100,
            110,
            100,
            110,
            91,
            92,
            91,
            92,
            92,
            91,
            92,
            91,
            93,
            38,
            110,
            110,
            96,
            96,
            69,
            69,
            69,
            69,
            69,
            69,
            69,
            69,
            69,
            84,
            84,
            81,
            87,
            81,
            87,
            84,
            84,
            84,
            84,
            84,
            84,
            84,
            84,
            84,
            43,
            43,
            85,
            88,
            87,
            87,
            72,
            72,
            72,
            72,
            72,
            72,
            72,
            72,
            72,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            87,
            41,
            41,
            71,
            68,
            68,
            68,
            68,
            68,
            68,
            68,
            68,
            80,
            86,
            84,
            77,
            84,
            77,
            77,
            84,
            77,
            84,
            84,
            77,
            84,
            77,
            82,
            38,
            38,
            38,
            47,
            67,
            100,
            100,
            100,
            100,
            100,
            100,
            100,
            100,
            100,
            120,
            120,
            120,
            100,
            120,
            100,
            100,
            60,
            50,
            60,
            96,
            96,
            96,
            96,
            96,
            96,
            96,
            96,
            96,
            110,
            110,
            110,
            110,
            110,
            110,
            96,
            110,
            96,
            110,
            110,
            97,
            110,
            97,
            55,
            49,
            74,
            65,
            65,
            65,
            65,
            65,
            65,
            65,
            65,
            65,
            77,
            80,
            80,
            77,
            81,
            77,
            70,
            85,
            70,
            85,
            81,
            83,
            86,
            78,
            80,
            39,
            45,
            39,
            55,
            39,
            39,
            39,
            120,
            120,
            110,
            110,
            95,
            95,
            95,
            75,
            75,
            75,
            75,
            110,
            110,
            110,
            110,
            110,
            110,
            90,
            90,
            90,
            90,
            90,
            90,
            90,
            90,
            57,
            64,
            64,
            64,
            64,
            64,
            64,
            64,
            64,
            64,
            79,
            79,
            79,
            79,
            79,
            79,
            82,
            79,
            82,
            79,
            79,
            79,
            79,
            79,
            79,
            38,
            51,
            37,
            37,
            100,
            100,
            100,
            100,
            100,
            100,
            68,
            68,
            68,
            68,
            68,
            68,
            83,
            83,
            40,
            49,
            74,
            89,
            89,
            89,
            89,
            94,
            94,
            94,
            94,
            110,
            110,
            54,
            92,
            92,
            92,
            92,
            92,
            92,
            82,
            82,
            82,
            82,
            98,
            98,
            50,
            90,
            90,
            77,
            77,
            66,
            90,
            90,
            77,
            77,
            86,
            86,
            86,
            84,
            84,
            84,
            84,
            54,
            78,
            37,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            82,
            69,
            69,
            69,
            69,
            89,
            89,
            89,
            89,
            130,
            130,
            130,
            110,
            110,
            130,
            130,
            60,
            93,
            69,
            69,
            69,
            69,
            100,
            100,
            100,
            100,
            60,
            96,
            96,
            96,
            96,
            96,
            96,
            55,
            64,
            64,
            64,
            64,
            64,
            64,
            64,
            38,
            63,
            56,
            56,
            56,
            56,
            63,
            63,
            63,
            63,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            91,
            91,
            83,
            83,
            83,
            83,
            91,
            91,
            83,
            83,
            83,
            83,
            91,
            91,
            84,
            84,
            84,
            84,
            91,
            91,
            84,
            84,
            84,
            84,
            88,
            88,
            75,
            75,
            75,
            75,
            88,
            88,
            71,
            71,
            71,
            71,
            90,
            90,
            76,
            76,
            76,
            76,
            44,
            110,
            110,
            62,
            62,
            62,
            62,
            110,
            110,
            73,
            73,
            73,
            73,
            110,
            110,
            73,
            73,
            73,
            73,
            52,
            72,
            72,
            98,
            98,
            98,
            98,
            110,
            110,
            62,
            62,
            62,
            62,
            90,
            90,
            75,
            75,
            75,
            75,
            70,
            70,
            70,
            100,
            100,
            100,
            100,
            100,
            74,
            74,
            100,
            100,
            100,
            100,
            100,
            100,
            69,
            69,
            69,
            69,
            100,
            100,
            71,
            71,
            71,
            71,
            96,
            96,
            69,
            68,
            68,
            69,
            110,
            110,
            70,
            70,
            70,
            70,
            130,
            130,
            64,
            64,
            64,
            64,
            84,
            84,
            76,
            76,
            76,
            76,
            45,
            45,
            84,
            84,
            76,
            76,
            76,
            76,
            110,
            110,
            62,
            62,
            62,
            62,
            110,
            110,
            68,
            68,
            68,
            68,
            41,
            110,
            110,
            70,
            70,
            70,
            70,
            110,
            110,
            62,
            62,
            62,
            62,
            110,
            110,
            70,
            70,
            70,
            70,
            69,
            53,
            110,
            160,
            160,
            170,
            140,
            140,
            160,
            160,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            54,
            54,
            76,
            98,
            120,
            140,
            54,
            76,
            98,
            120,
            140,
            54,
            76,
            98,
            120,
            140,
            54,
            76,
            98,
            120,
            140,
            81,
            140,
            110,
            120,
            140,
            98,
            81,
            81,
            79,
            79,
            79,
            67,
            67,
            52,
            52,
            52,
            63,
            53,
            53,
            43,
            55,
            55,
            59,
            69,
            45,
            45,
            69,
            67,
            55,
            50,
            65,
            65,
            65,
            70,
            69,
            69,
            53,
            41,
            41,
            71,
            30,
            71,
            45,
            71,
            20,
            30,
            82,
            84,
            71,
            45,
            71,
            64,
            79,
            59,
            41,
            20,
            32,
            67,
            67,
            43,
            50,
            53,
            45,
            53,
            45,
            65,
            65,
            56,
            32,
            43,
            50,
            66,
            54,
            67,
            65,
            110,
            71,
            110,
            79,
            69,
            65,
            56,
            20,
            67,
            53,
            62,
            32,
            32,
            62,
            69,
            56,
            48,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            66,
            66,
            66,
            100,
            66,
            66,
            66,
            66,
            140,
            100,
            66,
            66,
            66,
            100,
            140,
            66,
            66,
            68,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            100,
            39,
            100,
            39,
            66,
            66,
            100,
            100,
            110,
            64,
            66,
            100,
            66,
            100,
            66,
            66,
            78,
            68,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            0,
            0,
            94,
            61,
            61,
            61,
            61,
            52,
            52,
            52,
            99,
            110,
            110,
            91,
            91,
            98,
            130,
            140,
            52,
            87,
            79,
            52,
            66,
            52,
            52,
            53,
            52,
            52,
            52,
            52,
            52,
            52,
            51,
            68,
            38,
            58,
            200,
            71,
            130,
            42,
            58,
            54,
            79,
            79,
            58,
            58,
            73,
            97,
            65,
            65,
            65,
            77,
            65,
            62,
            79,
            79,
            79,
            79,
            79,
            79,
            41,
            45,
            18,
            72,
            45,
            44,
            31,
            59,
            31,
            49,
            79,
            79,
            79,
            79,
            79,
            79,
            62,
            24,
            32,
            33,
            42,
            61,
            20,
            33,
            36,
            37,
            20,
            0,
            0,
            0,
            0,
            110,
            58,
            69,
            54,
            47,
            62,
            47,
            61,
            57,
            57,
            63,
            110,
            110,
            110,
            110,
            110,
            110,
            69,
            66,
            53,
            47,
            47,
            47,
            52,
            54,
            59,
            43,
            51,
            52,
            50,
            70,
            58,
            61,
            47,
            56,
            43,
            42,
            41,
            42,
            40,
            43,
            39,
            61,
            49,
            53,
            44,
            47,
            53,
            60,
            71,
            44,
            35,
            32,
            47,
            52,
            50,
            63,
            49,
            50,
            56,
            57,
            50,
            57,
            58,
            55,
            48,
            42,
            47,
            49,
            39,
            41,
            41,
            46,
            49,
            44,
            61,
            54,
            48,
            67,
            40,
            45,
            51,
            42,
            57,
            82,
            48,
            48,
            50,
            48,
            48,
            45,
            42,
            55,
            61,
            62,
            57,
            49,
            50,
            56,
            59,
            42,
            84,
            43,
            51,
            57,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            110,
            49,
            35,
            54,
            58,
            57,
            42,
            64,
            44,
            52,
            51,
            58,
            46,
            45,
            37,
            45,
            40,
            42,
            42,
            53,
            60,
            63,
            55,
            47,
            49,
            42,
            54,
            48,
            46,
            63,
            51,
            56,
            58,
            56,
            47,
            67,
            52,
            63,
            62,
            32,
            45,
            51,
            66,
            110,
            110,
            110,
            110,
            110,
            110,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            71,
            58,
            73,
            97,
            65,
            65,
            65,
            77,
            65,
            62,
            140,
            140,
            140,
            160,
            140,
            140,
            70,
            58,
            73,
            97,
            65,
            65,
            65,
            77,
            65,
            62,
            140,
            140,
            140,
            160,
            140,
            140,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            62,
            77,
            93,
            64,
            64,
            70,
            72,
            57,
            52,
            32,
            37,
            62,
            52,
            80,
            69,
            73,
            64,
            73,
            73,
            74,
            100,
            68,
            66,
            66,
            56,
            62,
            62,
            54,
            68,
            74,
            92,
            74,
            61,
            85,
            63,
            57,
            48,
            64,
            54,
            57,
            69,
            56,
            63,
            65,
            35,
            48,
            33,
            39,
            40,
            31,
            31,
            37,
            39,
            19,
            24,
            35,
            29,
            45,
            38,
            38,
            42,
            40,
            32,
            35,
            33,
            38,
            44,
            39,
            39,
            40,
            57,
            40,
            40,
            36,
            36,
            31,
            31,
            40,
            21,
            38,
            60,
            40,
            40,
            33,
            40,
            40,
            40,
            27,
            40,
            44,
            60,
            35,
            40,
            40,
            39,
            39,
            54,
            40,
            21,
            28,
            41,
            36,
            40,
            40,
            39,
            55,
            38,
            100,
            68,
            70,
            40,
            92,
            61,
            69,
            44,
            40,
            55,
            40,
            55,
            61,
            42,
            61,
            98,
            24,
            24,
            61,
            60,
            63,
            61,
            61,
            31,
            78,
            55,
            24,
            92,
            61,
            61,
            37,
            55,
            43,
            55,
            55,
            55,
            61,
            61,
            61,
            61,
            50,
            50,
            72,
            24,
            55,
            24,
            61,
            60,
            41,
            39,
            38,
            41,
            35,
            25,
            25,
            41,
            42,
            17,
            17,
            17,
            17,
            30,
            17,
            17,
            30,
            63,
            63,
            42,
            42,
            42,
            42,
            41,
            37,
            17,
            24,
            42,
            43,
            42,
            39,
            35,
            39,
            39,
            39,
            41,
            43,
            52,
            52,
            0,
            0,
            52,
            52,
            52,
            52,
            56,
            56,
            38,
            57,
            57,
            48,
            41,
            43,
            79,
            79,
            79,
            60,
            58,
            59,
            53,
            46,
            48,
            48,
            79,
            44,
            46,
            33,
            42,
            47,
            45,
            44,
            43,
            47,
            45,
            42,
            45,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            79,
            0,
            0,
            72,
            60,
            63,
            69,
            75,
            69,
            63,
            69,
            77,
            57,
            82,
            69,
            85,
            69,
            82,
            69,
            82,
            69,
            82,
            69,
            70,
            66,
            70,
            66,
            60,
            61,
            60,
            61,
            60,
            61,
            59,
            40,
            79,
            69,
            81,
            68,
            83,
            70,
            81,
            68,
            81,
            68,
            81,
            68,
            32,
            32,
            46,
            30,
            76,
            65,
            76,
            65,
            72,
            64,
            61,
            30,
            59,
            32,
            59,
            32,
            59,
            32,
            93,
            110,
            95,
            100,
            93,
            110,
            81,
            68,
            82,
            70,
            81,
            68,
            81,
            68,
            87,
            67,
            85,
            68,
            87,
            67,
            87,
            67,
            66,
            69,
            61,
            69,
            70,
            45,
            76,
            47,
            70,
            45,
            70,
            45,
            59,
            56,
            75,
            57,
            59,
            56,
            59,
            56,
            59,
            56,
            70,
            41,
            68,
            43,
            70,
            41,
            70,
            41,
            76,
            68,
            76,
            68,
            76,
            68,
            81,
            70,
            76,
            68,
            75,
            65,
            75,
            65,
            110,
            90,
            110,
            90,
            110,
            90,
            94,
            85,
            110,
            90,
            69,
            67,
            69,
            67,
            69,
            57,
            67,
            63,
            75,
            58,
            67,
            63,
            68,
            41,
            85,
            57,
            61,
            36,
            47,
            46,
            92,
            55,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            75,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            70,
            66,
            46,
            30,
            46,
            30,
            87,
            67,
            87,
            67,
            87,
            67,
            87,
            67,
            87,
            67,
            87,
            67,
            87,
            67,
            89,
            67,
            89,
            67,
            89,
            67,
            89,
            67,
            89,
            67,
            81,
            70,
            81,
            70,
            83,
            73,
            83,
            73,
            83,
            73,
            83,
            73,
            83,
            73,
            68,
            65,
            68,
            65,
            68,
            65,
            68,
            65,
            100,
            65,
            56,
            49,
            50,
            50,
            76,
            76,
            76,
            76,
            76,
            76,
            76,
            76,
            76,
            79,
            100,
            100,
            97,
            98,
            86,
            84,
            52,
            52,
            52,
            52,
            52,
            52,
            79,
            79,
            79,
            79,
            100,
            100,
            100,
            100,
            79,
            79,
            68,
            68,
            68,
            68,
            68,
            68,
            68,
            68,
            100,
            100,
            120,
            120,
            120,
            120,
            110,
            100,
            40,
            40,
            40,
            40,
            40,
            40,
            40,
            40,
            51,
            51,
            73,
            75,
            73,
            74,
            60,
            56,
            68,
            68,
            68,
            68,
            68,
            68,
            79,
            79,
            100,
            100,
            130,
            130,
            120,
            76,
            79,
            79,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            79,
            96,
            79,
            120,
            79,
            120,
            79,
            100,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            100,
            110,
            130,
            130,
            120,
            120,
            110,
            110,
            69,
            69,
            56,
            56,
            70,
            70,
            30,
            30,
            67,
            67,
            69,
            69,
            89,
            89,
            79,
            79,
            76,
            76,
            76,
            76,
            76,
            76,
            76,
            76,
            120,
            120,
            140,
            140,
            140,
            140,
            130,
            120,
            68,
            68,
            68,
            68,
            68,
            68,
            68,
            68,
            140,
            140,
            160,
            160,
            160,
            160,
            150,
            150,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            140,
            150,
            170,
            170,
            160,
            160,
            150,
            150,
            76,
            76,
            76,
            76,
            76,
            79,
            76,
            76,
            76,
            76,
            75,
            75,
            120,
            68,
            30,
            68,
            68,
            68,
            68,
            68,
            68,
            79,
            68,
            68,
            70,
            83,
            83,
            96,
            120,
            68,
            68,
            68,
            40,
            40,
            30,
            30,
            79,
            79,
            40,
            40,
            32,
            32,
            46,
            59,
            79,
            68,
            68,
            68,
            66,
            66,
            69,
            69,
            67,
            67,
            66,
            66,
            70,
            70,
            68,
            83,
            80,
            70,
            70,
            70,
            79,
            79,
            99,
            99,
            99,
            79,
            99,
            99,
            87,
            97,
            90,
            100,
            130,
            70,
            68,
            79,
            55,
            110,
            55,
            110,
            37,
            28,
            18,
            70,
            40,
            22,
            6.9,
            0,
            0,
            0,
            0,
            0,
            64,
            64,
            70,
            70,
            110,
            110,
            65,
            70,
            30,
            30,
            30,
            30,
            50,
            50,
            50,
            50,
            70,
            70,
            60,
            52,
            37,
            52,
            90,
            35,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            19,
            170,
            150,
            40,
            61,
            61,
            36,
            60,
            83,
            39,
            50,
            50,
            79,
            69,
            46,
            70,
            55,
            55,
            51,
            100,
            36,
            40,
            36,
            36,
            89,
            78,
            78,
            70,
            70,
            60,
            60,
            53,
            35,
            55,
            53,
            61,
            110,
            55,
            77,
            65,
            110,
            65,
            65,
            110,
            65,
            77,
            110,
            31,
            24,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            46,
            24,
            79,
            79,
            60,
            60,
            46,
            60,
            60,
            46,
            46,
            46,
            46,
            25,
            25,
            60,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            46,
            25,
            25,
            79,
            31,
            31,
            31,
            28,
            31,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            79,
            79,
            79,
            70,
            77,
            77,
            70,
            70,
            110,
            82,
            130,
            130,
            110,
            92,
            69
        ];
    }), V1 = b1(), E1 = (t2)=>{
        let i2 = t2[64];
        return ([...n1])=>{
            let r4 = 0, g1 = 0, e1 = n1.length;
            for(; e1--;)g1 = t2[n1[e1].charCodeAt()], r4 += g1 === void 0 ? i2 : g1;
            return r4;
        };
    }, $1 = E1(V1);
    var d1 = {
        green: "3C1",
        blue: "08C",
        red: "E43",
        yellow: "DB1",
        orange: "F73",
        purple: "94E",
        pink: "E5B",
        grey: "999",
        gray: "999",
        cyan: "1BC",
        black: "2A2A2A"
    };
    function S1({ label: t3 , subject: i3 , status: n2 , color: r5 = "blue" , style: g2 , icon: e2 , iconWidth: h1 = 13 , labelColor: x1 = "555" , scale: f1 = 1  }) {
        if (k1(typeof n2 == "string", "<status> must be string"), t3 = t3 === void 0 ? i3 : t3, !t3 && !e2) return B1({
            status: n2,
            color: r5,
            style: g2,
            scale: f1
        });
        r5 = d1[r5] || r5, x1 = d1[x1] || x1, h1 = h1 * 10;
        let m1 = e2 ? t3.length ? h1 + 30 : h1 - 18 : 0, c1 = e2 ? m1 + 50 : 50, l2 = $1(t3), o6 = $1(n2), a2 = l2 + 100 + m1, w1 = o6 + 100, s1 = a2 + w1, u2 = e2 ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : "";
        t3 = y1(t3), n2 = y1(n2);
        let p2 = A1({
            label: t3,
            status: n2
        });
        return g2 === "flat" ? `<svg width="${f1 * s1 / 10}" height="${f1 * 20}" viewBox="0 0 ${s1} 200" xmlns="http://www.w3.org/2000/svg"${u2} role="img" aria-label="${p2}">
  <title>${p2}</title>
  <g>
    <rect fill="#${x1}" width="${a2}" height="200"/>
    <rect fill="#${r5}" x="${a2}" width="${w1}" height="200"/>
  </g>
  <g aria-hidden="true" fill="#fff" text-anchor="start" font-family="Verdana,DejaVu Sans,sans-serif" font-size="110">
    <text x="${c1 + 10}" y="148" textLength="${l2}" fill="#000" opacity="0.1">${t3}</text>
    <text x="${c1}" y="138" textLength="${l2}">${t3}</text>
    <text x="${a2 + 55}" y="148" textLength="${o6}" fill="#000" opacity="0.1">${n2}</text>
    <text x="${a2 + 45}" y="138" textLength="${o6}">${n2}</text>
  </g>
  ${e2 ? `<image x="40" y="35" width="${h1}" height="132" xlink:href="${e2}"/>` : ""}
</svg>` : `<svg width="${f1 * s1 / 10}" height="${f1 * 20}" viewBox="0 0 ${s1} 200" xmlns="http://www.w3.org/2000/svg"${u2} role="img" aria-label="${p2}">
  <title>${p2}</title>
  <linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-opacity=".1" stop-color="#EEE"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="m"><rect width="${s1}" height="200" rx="30" fill="#FFF"/></mask>
  <g mask="url(#m)">
    <rect width="${a2}" height="200" fill="#${x1}"/>
    <rect width="${w1}" height="200" fill="#${r5}" x="${a2}"/>
    <rect width="${s1}" height="200" fill="url(#a)"/>
  </g>
  <g aria-hidden="true" fill="#fff" text-anchor="start" font-family="Verdana,DejaVu Sans,sans-serif" font-size="110">
    <text x="${c1 + 10}" y="148" textLength="${l2}" fill="#000" opacity="0.25">${t3}</text>
    <text x="${c1}" y="138" textLength="${l2}">${t3}</text>
    <text x="${a2 + 55}" y="148" textLength="${o6}" fill="#000" opacity="0.25">${n2}</text>
    <text x="${a2 + 45}" y="138" textLength="${o6}">${n2}</text>
  </g>
  ${e2 ? `<image x="40" y="35" width="${h1}" height="130" xlink:href="${e2}"/>` : ""}
</svg>`;
    }
    function B1({ status: t4 , color: i4 , style: n3 , scale: r6  }) {
        k1(typeof t4 == "string", "<status> must be string"), i4 = d1[i4] || i4 || d1.blue;
        let g3 = $1(t4), e3 = g3 + 115;
        return t4 = y1(t4), n3 === "flat" ? `<svg width="${r6 * e3 / 10}" height="${r6 * 20}" viewBox="0 0 ${e3} 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${t4}">
  <title>${t4}</title>
  <g>
    <rect fill="#${i4}" x="0" width="${e3}" height="200"/>
  </g>
  <g aria-hidden="true" fill="#fff" text-anchor="start" font-family="Verdana,DejaVu Sans,sans-serif" font-size="110">
    <text x="65" y="148" textLength="${g3}" fill="#000" opacity="0.1">${t4}</text>
    <text x="55" y="138" textLength="${g3}">${t4}</text>
  </g>
</svg>` : `<svg width="${r6 * e3 / 10}" height="${r6 * 20}" viewBox="0 0 ${e3} 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${t4}">
  <title>${t4}</title>
  <linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-opacity=".1" stop-color="#EEE"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="m"><rect width="${e3}" height="200" rx="30" fill="#FFF"/></mask>
  <g mask="url(#m)">
    <rect width="${e3}" height="200" fill="#${i4}" x="0"/>
    <rect width="${e3}" height="200" fill="url(#a)"/>
  </g>
  <g aria-hidden="true" fill="#fff" text-anchor="start" font-family="Verdana,DejaVu Sans,sans-serif" font-size="110">
    <text x="65" y="148" textLength="${g3}" fill="#000" opacity="0.25">${t4}</text>
    <text x="55" y="138" textLength="${g3}">${t4}</text>
  </g>
</svg>`;
    }
    function y1(t5) {
        return t5.replace(/\u0026/g, "&amp;").replace(/\u003C/g, "&lt;").replace(/\u003E/g, "&gt;").replace(/\u0022/g, "&quot;").replace(/\u0027/g, "&apos;");
    }
    function A1({ label: t6 , status: i5  }) {
        let n4 = t6 ? `${t6}: ` : "";
        return n4 + i5;
    }
    function k1(t7, i6) {
        if (!t7) throw new TypeError(i6);
    }
    typeof window == "object" && (window.badgen = S1);
})();
const isBadgenBadgeContent = typeGuard("status");
function badgenBlock(_TODO_forLaterExtension) {
    const state = {
        content: undefined,
        renderTarget: undefined
    };
    const block = {
        badgeHTML: (content)=>{
            return block.decorateHTML(window.badgen(content), content);
        },
        decorateHTML: (html, content)=>{
            state.content = content;
            if (content.title) {
                html = `<span title="${content.title}">${html}</span>`;
            }
            if (content.action) {
                html = `<a onclick="${content.action}">${html}</a>`;
            }
            return html;
        },
        renderElement: (elem, content)=>{
            if (elem) {
                elem.innerHTML = block.badgeHTML(content);
            } else {
                console.error(`[badgenBlock.renderElement] target element is undefined`, content);
            }
        },
        prepareRenderTarget: (targetSupplier, eventName)=>{
            const isCustomEvent = (o7)=>{
                if (o7 && typeof o7 === "object") {
                    if ("content" in o7.detail) return true;
                }
                return false;
            };
            state.renderTarget = {
                targetSupplier,
                eventName
            };
            window.document.addEventListener(eventName, (event)=>{
                const target = state.renderTarget?.targetSupplier?.();
                if (target && isCustomEvent(event)) {
                    const { content , autoDisplay  } = event.detail;
                    block.renderElement(target, content);
                    if (autoDisplay) target.style.display = "block";
                } else {
                    console.warn(`[badgenBlock.eventListener] unable to render HTML`, target, event);
                }
            });
        },
        render: (event)=>{
            if (state.renderTarget) {
                window.document.dispatchEvent(new CustomEvent(state.renderTarget.eventName, {
                    detail: event
                }));
            }
        }
    };
    return block;
}
export { isBadgenBadgeContent as isBadgenBadgeContent };
export { badgenBlock as badgenBlock };
class BadgenBadgeElement extends HTMLElement {
    static badgenBadgeElementIndex = 0;
    static badgeNameAttrName = "name";
    #renderReqEventName;
    #defaultName;
    #block;
    constructor(){
        super();
        BadgenBadgeElement.badgenBadgeElementIndex++;
        this.#defaultName = `badge${BadgenBadgeElement.badgenBadgeElementIndex}`;
        this.#block = badgenBlock();
    }
    static get observedAttributes() {
        return [
            BadgenBadgeElement.badgeNameAttrName
        ];
    }
    attributeChangedCallback(name) {
        if (name == BadgenBadgeElement.badgeNameAttrName) {
            this.#renderReqEventName = `auto-update-${this.name}`;
            this.#block.prepareRenderTarget(()=>this
            , this.#renderReqEventName);
        }
    }
    connectedCallback() {
        this.innerHTML = `<code>${this.name}</code> listening for <code>${this.#renderReqEventName}</code>`;
    }
    get name() {
        return this.getAttribute(BadgenBadgeElement.badgeNameAttrName) || this.#defaultName;
    }
    set name(value) {
        this.setAttribute(BadgenBadgeElement.badgeNameAttrName, value);
    }
}
function* registerBadgenBadgeCE(suggestedName = "auto-badge") {
    if (!window.customElements.get(suggestedName)) {
        window.customElements.define(suggestedName, BadgenBadgeElement);
    }
    yield BadgenBadgeElement;
}
export { registerBadgenBadgeCE as registerBadgenBadgeCE };
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
            const indentCount = whitespace ? whitespace.reduce((r7, a3)=>Math.min(r7, a3.length)
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
                        for(let i7 = 0; i7 < tokens.length; i7++){
                            if (tokens[i7].type !== "heading_close") {
                                continue;
                            }
                            const headingOpen = tokens[i7 - 2];
                            const headingClose = tokens[i7];
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
                for (const s2 of selected){
                    const importedNode = document.adoptNode(s2);
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
const projectDomain = v("project");
const projectInitFx = projectDomain.createEffect(async ()=>(await fetch("/publication/inspect/project.json")).json()
);
const $project = projectDomain.createStore(null).on(projectInitFx.doneData, (_, project)=>project
);
const serviceBusDomain = v("serviceBus");
const consoleServiceBusInitFx = serviceBusDomain.createEffect(async ({ eventSource , presentation , diagnostics  })=>{
    const baseURL = "/console";
    const userAgentFingerprint = window.location.toString();
    return new ServiceBus(serviceBusArguments({
        fetchBaseURL: `${baseURL}/user-agent-bus`,
        esTunnels: function*(serviceBusOnMessage) {
            const esURL1 = `${baseURL}/sse/tunnel`;
            const esEndpointValidator = typicalConnectionValidator(`${baseURL}/sse/ping`);
            const eventSourceFactory = {
                construct: (esURL)=>eventSource(esURL, serviceBusOnMessage)
            };
            const consoleTunnel = new EventSourceTunnel({
                esURL: esURL1,
                esEndpointValidator,
                eventSourceFactory,
                userAgentFingerprint,
                options: {
                    onConnStateChange: (active, previous, tunnel)=>{
                        const escn = eventSourceConnNarrative(tunnel);
                        if (diagnostics.verbose) {
                            console.log("connection state", escn.summary, escn.summaryHint, active, previous);
                        }
                        presentation.render({
                            content: {
                                label: "Tunnel",
                                status: escn.summary,
                                title: escn.summaryHint,
                                color: escn.color
                            },
                            autoDisplay: true
                        });
                    },
                    onReconnStateChange: (active, previous, _reconnStrategy, tunnel)=>{
                        const escn = eventSourceConnNarrative(tunnel);
                        if (diagnostics.verbose) {
                            console.log("reconnection state", active, previous, escn.summary, escn.summaryHint);
                        }
                        presentation.render({
                            content: {
                                label: "Tunnel",
                                status: escn.summary,
                                title: escn.summaryHint,
                                color: escn.color
                            },
                            autoDisplay: true
                        });
                    }
                }
            });
            consoleTunnel.init();
            yield consoleTunnel;
        }
    }));
});
const $consoleServiceBus = serviceBusDomain.createStore(null).on(consoleServiceBusInitFx.doneData, (_, serviceBus)=>serviceBus
);
export { editableFileRedirectURL as editableFileRedirectURL };
export { editableFileRefHTML as editableFileRefHTML };
export { locationEditorRedirectURL as locationEditorRedirectURL };
export { locationEditorHTML as locationEditorHTML };
export { projectDomain as projectDomain };
export { projectInitFx as projectInitFx };
export { $project as $project };
export { serviceBusDomain as serviceBusDomain };
export { consoleServiceBusInitFx as consoleServiceBusInitFx };
export { $consoleServiceBus as $consoleServiceBus };
