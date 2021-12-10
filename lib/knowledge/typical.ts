import * as safety from "../safety/mod.ts";
import * as govn from "./governance.ts";

export function isTermDefn(o: unknown): o is govn.TermDefn {
  if (Array.isArray(o) && o.length > 0 && o.length < 4) {
    const [term, _label, _namespace] = o;
    if (term) return true;
  }
  return false;
}

export const isTermElaboration = safety.typeGuard<govn.TermElaboration>("term");

export function isTerm(o: unknown): o is govn.Term {
  if (typeof o === "string") return true;
  if (isTermDefn(o)) return true;
  if (isTermElaboration(o)) return true;
  return false;
}

export function termLabel(
  t: govn.Term,
  onInvalid?: (t: govn.Term) => string,
): string {
  if (typeof t === "string") return t;
  if (isTermDefn(t)) return t[1] || t[0];
  if (isTermElaboration(t)) return t.label || t.term;
  return onInvalid ? onInvalid(t) : `${t} is not a Term`;
}

export function termNamespace(t: govn.Term): string | undefined {
  if (typeof t === "string") return undefined;
  if (isTermDefn(t)) return t.length > 2 ? t[2] : undefined;
  if (isTermElaboration(t)) return t.namespace;
}

export function isFolksonomy(o: unknown): o is govn.Folksonomy {
  if (Array.isArray(o)) {
    for (const potential of o) {
      // if any single item is not a term, then assume it's not taxonomy
      if (!isTerm(potential)) return false;
    }
    return true;
  }
  if (isTerm(o)) return true;
  return false;
}

export function isTaxonomy(o: unknown): o is govn.Taxonomy {
  // right now taxonomy is same as folksonomy
  if (isFolksonomy(o)) return true;
  return false;
}
