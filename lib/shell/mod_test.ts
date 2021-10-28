import { testingAsserts as ta } from "./deps-test.ts";
import "./mod.ts"; // need window.shell from here

const testSH = window.shell;
ta.assert(testSH);

Deno.test(`Test shell with invalid command which produces Deno exception (non-zero result)`, async () => {
  let reportError: Error | undefined;
  const result = await testSH.execute(
    {
      runOptions: (inherit) =>
        testSH.cmdRunOptions("bad command --with --params", inherit),
      reportError: (error) => {
        reportError = error;
      },
    },
  );
  ta.assertEquals(
    result,
    undefined,
    "Since the command was bad, we shouldn't have a result",
  );
  ta.assert(reportError, "Error should be trapped and reported");
});

Deno.test(`Test shell with Git command execution (non-zero result)`, async () => {
  const testDir = Deno.makeTempDirSync();
  let consumeStdErr: string | undefined;
  const result = await testSH.execute(
    {
      runOptions: (inherit) =>
        testSH.cmdRunOptions("git status", { cwd: testDir, ...inherit }),
      consumeStdErr: (stdErr) => {
        consumeStdErr = stdErr;
      },
    },
  );
  ta.assert(result, "The command should be valid");
  ta.assert(
    consumeStdErr,
    "Error should be reported since testDir is not a Git repo",
  );
  ta.assertEquals(result.status.code, 128);
  Deno.removeSync(testDir, { recursive: true });
});

Deno.test(`Test shell with Git command execution (zero result)`, async () => {
  let resultReported = false;
  let stdOutConsumed: string | undefined;
  const result = await testSH.execute(
    {
      runOptions: (inherit) => testSH.cmdRunOptions("git status", inherit),
      reportResult: (ser) => {
        resultReported = true;
        ta.assertEquals(ser.status.code, 0, "Command result should be zero");
      },
      consumeStdOut: (stdOut) => {
        stdOutConsumed = stdOut;
      },
    },
  );
  ta.assert(result, "The command should be valid");
  ta.assert(
    resultReported,
    "resultReported not encountered, reportResult did not execute",
  );
  ta.assert(
    stdOutConsumed,
    "stdOutConsumed not defined, consumeStdOut did not execute",
  );
});

Deno.test(`Test shell with Git command execution (inherit not used)`, () => {
  ta.assertThrowsAsync(async () => {
    await testSH.execute({
      // test what happens when inherit is not used, should throw exception
      // because we expect stderr, stdout to be "piped"
      runOptions: () => testSH.cmdRunOptions("git status"),
    });
  });
});

Deno.test(`Test shell with Git command execution (dry run)`, async () => {
  let dryRunReportEncountered = false;
  const result = await testSH.execute(
    {
      runOptions: (inherit) =>
        testSH.cmdRunOptions("git status -s", { isDryRun: true, ...inherit }),
      reportRun: (ro, isDryRun) => {
        dryRunReportEncountered = isDryRun || false;
        ta.assertEquals(ro.cmd, ["git", "status", "-s"]);
      },
    },
  );
  ta.assertEquals(result, undefined, "if dry run is true, no result");
  ta.assert(
    dryRunReportEncountered,
    "dryRunReportEncountered not encountered, reportRun did not execute",
  );
});
