import * as ta from "https://deno.land/std@0.123.0/testing/asserts.ts";
import * as mod from "./transform.ts";

Deno.test(`tableRow as-is`, () => {
  const o = {
    propertyOne: "one",
    propertyTwo: 100,
    dateInObj: new Date(),
    propertyThree3: 250,
  };
  const row = mod.tableRecordFromObject<{
    property_one: string;
    property_two: number;
    property_three3?: number;
  }>(o);
  ta.assertEquals(row.property_one, o.propertyOne);
  ta.assertEquals(row.property_two, o.propertyTwo);
  ta.assertEquals(row.property_three3, o.propertyThree3);

  // date will be copied even though it's not in the table row definition
  // deno-lint-ignore no-explicit-any
  ta.assert((row as any).date_in_obj);
});

Deno.test(`tableRow without Date using column names`, () => {
  const o = {
    propertyOne: "one",
    propertyTwo: 100,
    dateInObj: new Date(),
    propertyThree3: 250,
  };
  const row = mod.tableColumnsFromObject<{
    property_one: string;
    property_two: number;
    property_three3?: number;
  }>(o, undefined, "property_one", "property_two", "property_three3");
  ta.assertEquals(row.property_one, o.propertyOne);
  ta.assertEquals(row.property_two, o.propertyTwo);
  ta.assertEquals(row.property_three3, o.propertyThree3);

  // date will not be copied
  // deno-lint-ignore no-explicit-any
  ta.assert((row as any).date_in_obj === undefined);
});

Deno.test(`tableRow with transformed Date using prop names`, () => {
  const o = {
    propertyOne: "one",
    propertyTwo: 100,
    dateInObj: new Date(),
    propertyThree3: 250,
  };
  const row = mod.tableColumnsFromObjectProperties<{
    property_one: string;
    property_two: number;
    property_three3?: number;
    // deno-lint-ignore no-explicit-any
    date_in_obj: any; // set this to any or unknown so that we can do transformation
  }>(o, undefined, "propertyOne", "propertyTwo", "propertyThree3", [
    "dateInObj",
    (d) => `${d}`,
  ]);
  ta.assertEquals(row.property_one, o.propertyOne);
  ta.assertEquals(row.property_two, o.propertyTwo);
  ta.assertEquals(row.property_three3, o.propertyThree3);
  ta.assert(row.date_in_obj);
  ta.assert(o.dateInObj instanceof Date);
  ta.assert(typeof row.date_in_obj === "string");
});
