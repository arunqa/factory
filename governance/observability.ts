import { events } from "./deps.ts";
import * as health from "../lib/health/mod.ts";
import * as tab from "../lib/tabular/mod.ts";

export interface ObservabilityHealthComponentCategorySupplier {
  readonly category: string | string[];
}

export interface ObservabilityHealthComponentStatus
  extends ObservabilityHealthComponentCategorySupplier {
  readonly status: health.ServiceHealthComponentStatus;
}

export interface ObservabilityHealthComponentStatusSupplier {
  readonly obsHealthStatus: () => AsyncGenerator<
    ObservabilityHealthComponentStatus
  >;
}

export interface ObservableSqlViewsSupplier {
  readonly observableSqlViews: () => AsyncGenerator<
    // deno-lint-ignore no-explicit-any
    tab.DefinedTabularRecordsProxy<any>
  >;
}

export class ObservabilityEventsEmitter extends events.EventEmitter<{
  healthStatusSupplier(ohcss: ObservabilityHealthComponentStatusSupplier): void;
  sqlViewsSupplier(sps: ObservableSqlViewsSupplier): void;
}> {}

export interface ObservabilityEventsEmitterSupplier {
  readonly events: ObservabilityEventsEmitter;
}

export interface LintRule {
  readonly code: string;
  readonly humanFriendly: string;
  readonly namespace?: string;
}

export interface LintRuleSupplier<Rule = LintRule> {
  (code: string, namespace?: string): Rule;
}

export interface LintDiagnostic {
  readonly rule: LintRule;
}

export interface LintReporter<Diagnostic = LintDiagnostic> {
  readonly report: (ld: Diagnostic) => void;
}

export interface Lintable<Diagnostic = LintDiagnostic> {
  lint: (reporter: LintReporter<Diagnostic>) => void;
}
