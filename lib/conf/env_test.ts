import { safety } from "../../deps.ts";
import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";

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

const eventsVerbose = Deno.env.get("ENV_TEST_VERBOSE") ? true : false;
const testConfiguredPropsCount = 3;
function testConfigProperties(
  ec: mod.EnvConfiguration<TestConfig, TestContext>,
): mod.ConfigurableEnvVarPropertiesSupplier<TestConfig, TestContext> {
  return {
    properties: [
      ec.textProperty("text", [{ override: "altText" }]),
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
    super(
      testConfigProperties,
      mod.namespacedEnvVarNameUppercase("CFGTEST_"),
      mod.envConfigurationEventsConsoleEmitter(eventsVerbose),
    );
  }

  constructSync(): TestConfig {
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
    p: mod.ConfigurableEnvVarProperty<TestConfig, unknown, TestContext>,
    _ctx: TestContext,
    _config: TestConfig,
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
    super(
      testConfigProperties,
      mod.namespacedEnvVarNameUppercase("CFGTEST_"),
      mod.envConfigurationEventsConsoleEmitter(eventsVerbose),
    );
  }

  constructSync(): TestConfig {
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
    p: mod.ConfigurableEnvVarProperty<TestConfig, any, TestContext>,
    _ctx: TestContext,
    _config: TestConfig,
  ): unknown {
    this.unhandled.push(p);
    return undefined;
  }
}

Deno.test(`EnvConfiguration with unhandled number and complex type`, () => {
  const testTextPropValue = "test";
  Deno.env.set("CFGTEST_TEXT", testTextPropValue);
  const proxy = new TestAsyncEnvConfiguration();
  const envConfig = new mod.CacheableConfigurationSupplier(proxy);
  const config = envConfig.configureSync({});
  Deno.env.delete("CFGTEST_TEXT");
  ta.assertEquals(
    proxy.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  ta.assertEquals(config.text, testTextPropValue);

  // neither "CFGTEST_NUMBER" nor "CFGTEST_COMPLEX" are provided, catch them
  ta.assertEquals(proxy.unhandled.length, 2);
});

Deno.test(`EnvConfiguration with aliases`, () => {
  const testTextPropValue = "altTextTest";
  Deno.env.set("CFGTEST_ALT_TEXT", testTextPropValue);
  const envConfig = new TestAsyncEnvConfiguration();
  const config = envConfig.configureSync({});
  Deno.env.delete("CFGTEST_ALT_TEXT");
  ta.assertEquals(config.text, testTextPropValue);
});

Deno.test(`AsyncEnvConfiguration with unhandled complex type`, async () => {
  const testTextPropValue = "test";
  const testNumberPropValue = 100;
  Deno.env.set("CFGTEST_TEXT", testTextPropValue);
  Deno.env.set("CFGTEST_NUMBER", testNumberPropValue.toString());
  const envConfig = new TestAsyncEnvConfiguration();
  const config = await envConfig.configure({});
  Deno.env.delete("CFGTEST_TEXT");
  Deno.env.delete("CFGTEST_NUMBER");
  ta.assertEquals(
    envConfig.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  ta.assertEquals(config.text, testTextPropValue);
  ta.assertEquals(config.number, testNumberPropValue);

  // "CFGTEST_COMPLEX_TYPE" is not supplied so be sure we catch it
  ta.assertEquals(envConfig.unhandled.length, 1);
});

Deno.test(`AsyncEnvConfiguration, cached, with no unhandled types`, async () => {
  const testTextPropValue = "test";
  const testNumberPropValue = 100;
  const testComplexValue = { innerText: "complex", innerNumber: -1 };
  Deno.env.set("CFGTEST_TEXT", testTextPropValue);
  Deno.env.set("CFGTEST_NUMBER", testNumberPropValue.toString());
  Deno.env.set("CFGTEST_COMPLEX_TYPE", JSON.stringify(testComplexValue));
  const proxy = new TestAsyncEnvConfiguration();
  const envConfig = new mod.CacheableConfigurationSupplier(proxy);
  const config = await envConfig.configure({});
  Deno.env.delete("CFGTEST_TEXT");
  Deno.env.delete("CFGTEST_NUMBER");
  Deno.env.delete("CFGTEST_COMPLEX_TYPE");
  ta.assertEquals(
    proxy.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  ta.assertEquals(config.text, testTextPropValue);
  ta.assertEquals(config.number, testNumberPropValue);
  ta.assertEquals(config.complexType, testComplexValue);
  ta.assertEquals(proxy.unhandled.length, 0);
});

Deno.test(`AsyncEnvConfiguration with failed guards`, async () => {
  Deno.env.set("CFGTEST_NUMBER", "bad");
  Deno.env.set("CFGTEST_COMPLEX_TYPE", `{ badText: "complex" }`);
  const envConfig = new TestAsyncEnvConfiguration();
  const config = await envConfig.configure({});
  Deno.env.delete("CFGTEST_NUMBER");
  Deno.env.delete("CFGTEST_COMPLEX_TYPE");
  ta.assertEquals(
    envConfig.ps.properties.length,
    testConfiguredPropsCount,
  );
  ta.assert(config);
  // the guard failure condition replaces complexType with something useful
  ta.assertEquals(config.number, NaN);
  ta.assertEquals(config.complexType, { innerNumber: -1, innerText: "bad" });

  // "CFGTEST_TEXT" is not provided so be sure we catch it
  ta.assertEquals(envConfig.unhandled.length, 1);
});
