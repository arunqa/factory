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
