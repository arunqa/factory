import { safety } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./env.ts";

interface TestComplexConfigProperty {
  innerText: string;
  innerNumber: number;
}

const isTestComplexConfigProperty = safety.typeGuard<TestComplexConfigProperty>(
  "innerText",
  "innerNumber",
);

interface TestConfig {
  text: string;
  number: number;
  complexType: TestComplexConfigProperty;
}

// deno-lint-ignore no-empty-interface
interface TestContext {
}

const testConfiguredPropsCount = 3;
function testConfigProperties(
  ec: mod.EnvConfiguration<TestConfig, TestContext>,
): mod.ConfigurableEnvVarPropertiesSupplier<TestConfig, TestContext> {
  return {
    properties: [
      ec.textProperty("text"),
      ec.numericProperty("number"),
      ec.jsonTextProperty<TestComplexConfigProperty>(
        "complexType",
        isTestComplexConfigProperty,
        () => ({ innerText: "bad", "innerNumber": -1 }),
      ),
    ],
  };
}

export class TestEnvConfiguration
  extends mod.EnvConfiguration<TestConfig, TestContext> {
  readonly unhandled: mod.ConfigurableEnvVarProperties<
    TestConfig,
    TestContext
  > = [];

  constructor() {
    super(testConfigProperties, mod.namespacedEnvVarNameUppercase("CFGTEST_"));
  }

  constructSync(_ctx: TestContext): TestConfig {
    return {
      text: "",
      number: 0,
      complexType: {
        innerText: "",
        innerNumber: 0,
      },
    };
  }

  unhandledPropertySync(
    p: mod.ConfigurableEnvVarProperty<TestConfig, TestContext, unknown>,
    _ctx: TestContext,
    _config: TestConfig,
    _envVarName: string,
    _envVarValue?: string,
  ): unknown {
    this.unhandled.push(p);
    return undefined;
  }
}

export class TestAsyncEnvConfiguration
  extends mod.AsyncEnvConfiguration<TestConfig, TestContext> {
  readonly unhandled: mod.ConfigurableEnvVarProperties<
    TestConfig,
    TestContext
  > = [];

  constructor() {
    super(testConfigProperties, mod.namespacedEnvVarNameUppercase("CFGTEST_"));
  }

  constructSync(_ctx: TestContext): TestConfig {
    return {
      text: "",
      number: 0,
      complexType: {
        innerText: "",
        innerNumber: 0,
      },
    };
  }

  unhandledPropertySync(
    // deno-lint-ignore no-explicit-any
    p: mod.ConfigurableEnvVarProperty<TestConfig, TestContext, any>,
    _ctx: TestContext,
    _config: TestConfig,
    _envVarName: string,
    _envVarValue?: string,
  ): unknown {
    this.unhandled.push(p);
    return undefined;
  }
}

Deno.test(`EnvConfiguration with unhandled number and complex type`, () => {
  const testTextPropValue = "test";
  Deno.env.set("CFGTEST_TEXT", testTextPropValue);
  const envConfig = new TestAsyncEnvConfiguration();
  const config = envConfig.configureSync({});
  ta.assertEquals(
    envConfig.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  ta.assertEquals(config.text, testTextPropValue);

  // no "CFGTEST_NUMBER" or "CFGTEST_COMPLEX" are provided, catch them
  ta.assertEquals(envConfig.unhandled.length, 2);
});

Deno.test(`AsyncEnvConfiguration with unhandled complex type`, async () => {
  const testTextPropValue = "test";
  const testNumberPropValue = 100;
  Deno.env.set("CFGTEST_TEXT", testTextPropValue);
  Deno.env.set("CFGTEST_NUMBER", testNumberPropValue.toString());
  const envConfig = new TestAsyncEnvConfiguration();
  const config = await envConfig.configure({});
  ta.assertEquals(
    envConfig.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  ta.assertEquals(config.text, testTextPropValue);
  ta.assertEquals(config.number, testNumberPropValue);

  // no "CFGTEST_COMPLEX_TYPE" is provided so be sure we catch it
  ta.assertEquals(envConfig.unhandled.length, 1);
});

Deno.test(`AsyncEnvConfiguration with no unhandled types`, async () => {
  const testTextPropValue = "test";
  const testNumberPropValue = 100;
  const testComplexValue = { innerText: "complex", innerNumber: -1 };
  Deno.env.set("CFGTEST_TEXT", testTextPropValue);
  Deno.env.set("CFGTEST_NUMBER", testNumberPropValue.toString());
  Deno.env.set("CFGTEST_COMPLEX_TYPE", JSON.stringify(testComplexValue));
  const envConfig = new TestAsyncEnvConfiguration();
  const config = await envConfig.configure({});
  ta.assertEquals(
    envConfig.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  ta.assertEquals(config.text, testTextPropValue);
  ta.assertEquals(config.number, testNumberPropValue);
  ta.assertEquals(config.complexType, testComplexValue);
  ta.assertEquals(envConfig.unhandled.length, 0);
});

Deno.test(`AsyncEnvConfiguration with failed guards`, async () => {
  Deno.env.set("CFGTEST_NUMBER", "bad");
  Deno.env.set("CFGTEST_COMPLEX_TYPE", `{ badText: "complex" }`);
  const envConfig = new TestAsyncEnvConfiguration();
  const config = await envConfig.configure({});
  ta.assertEquals(
    envConfig.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  // the guard failure condition replaces complexType with something useful
  ta.assertEquals(config.number, NaN);
  ta.assertEquals(config.complexType, { innerNumber: -1, innerText: "bad" });
  ta.assertEquals(envConfig.unhandled.length, 0);
});
