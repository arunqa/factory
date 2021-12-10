import { testingAsserts as ta, yaml } from "./deps-test.ts";
import * as mod from "./mod.ts";

const fmSingle = `folksonomy: untyped-tag-1
taxonomy: typed-tag-1
`;

const fmArray = `folksonomy:
  - untyped-tag-1
  - [untyped-tag-2-value, Untyped Tag 2 Label (No Namespace)]
  - [untyped-tag-3-value, Untyped Tag 3 Label, namespace]
  - term: untyped-tag-4-value
    label: Untyped Tag 4 Label
    namespace: namespace
taxonomy:
  - typed-tag-1
  - [typed-tag-2-value, "Typed Tag 2 Label"]
  - [typed-tag-3-value, "Typed Tag 3 Label", typed-tag-3-namespace]
  - term: untyped-tag-4-value
    label: Untyped Tag 4 Label
    namespace: namespace
`;

Deno.test(`YAML Knowledge Representation (single)`, () => {
  const testSingle = yaml.parse(fmSingle) as Record<string, unknown>;
  ta.assert(mod.isFolksonomy(testSingle.folksonomy));
  ta.assert(mod.isTaxonomy(testSingle.taxonomy));
});

Deno.test(`YAML Knowledge Representation (array)`, () => {
  const testArray = yaml.parse(fmArray) as Record<string, unknown>;
  ta.assert(mod.isFolksonomy(testArray.folksonomy));
  ta.assert(mod.isTaxonomy(testArray.taxonomy));
});
