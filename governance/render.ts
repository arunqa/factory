import * as fm from "./frontmatter.ts";
import * as m from "./model.ts";

export interface MutableRenderMetricsSupplier {
  renderMeasure: PerformanceMeasure;
}

export type RenderMetricsSupplier = Readonly<MutableRenderMetricsSupplier>;

export interface RenderTargetsSupplier<Nature> {
  readonly renderTargets: Nature | Nature[];
}

export interface RenderContextSupplier<Context> {
  readonly renderContext: Context;
}

export interface LayoutStrategy<Layout, LayoutResult> {
  readonly rendered: (layout: Layout) => Promise<LayoutResult>;
  readonly renderedSync: (source: Layout) => LayoutResult;
}

export type LayoutStrategyIdentity = string;

export interface IdentifiableLayoutStrategy<Layout, LayoutResult>
  extends LayoutStrategy<Layout, LayoutResult> {
  readonly identity: LayoutStrategyIdentity;
}

export interface LayoutStrategySupplier<Layout, LayoutResult> {
  readonly layoutStrategy: LayoutStrategy<Layout, LayoutResult>;
}

export interface NamedLayoutStrategySupplier<Layout, LayoutResult>
  extends LayoutStrategySupplier<Layout, LayoutResult> {
  readonly isNamedLayoutStrategyStrategySupplier: true;
  readonly layoutStrategyIdentity: LayoutStrategyIdentity;
}

export interface DefaultLayoutStrategySupplier<Layout, LayoutResult>
  extends LayoutStrategySupplier<Layout, LayoutResult> {
  readonly isDefaultLayoutStrategy: true;
}

export interface InferredLayoutStrategySupplier<Layout, LayoutResult>
  extends LayoutStrategySupplier<Layout, LayoutResult> {
  readonly isInferredLayoutStrategySupplier: true;
}

export interface FrontmatterLayoutStrategySupplier<Layout, LayoutResult>
  extends InferredLayoutStrategySupplier<Layout, LayoutResult> {
  readonly isFrontmatterLayoutStrategy: true;
  readonly frontmatterLayoutStrategyPropertyName: string;
}

export interface ModelLayoutStrategySupplier<Layout, LayoutResult>
  extends InferredLayoutStrategySupplier<Layout, LayoutResult> {
  readonly isModelLayoutStrategy: true;
  readonly modelLayoutStrategyDiagnostic: string;
}

export interface ErrorLayoutStrategySupplier<Layout, LayoutResult>
  extends LayoutStrategySupplier<Layout, LayoutResult> {
  readonly isErrorLayoutStrategySupplier: true;
  readonly layoutStrategyErrorDiagnostic: string;
}

export interface LayoutStrategies<Layout, LayoutResult> {
  readonly namedLayoutStrategy: (
    name: LayoutStrategyIdentity,
  ) => LayoutStrategySupplier<Layout, LayoutResult>;
}

export interface LayoutStrategiesSupplier<Layout, LayoutResult> {
  readonly layoutStrategies: LayoutStrategies<Layout, LayoutResult>;
}

export type RenderStrategyIdentity = string;

export interface RenderStrategy<Layout, LayoutResult>
  extends LayoutStrategiesSupplier<Layout, LayoutResult> {
  readonly identity: RenderStrategyIdentity;
  readonly inferredLayoutStrategy: (
    s: Partial<
      | fm.FrontmatterSupplier<fm.UntypedFrontmatter>
      | m.ModelSupplier<m.UntypedModel>
    >,
  ) => LayoutStrategySupplier<Layout, LayoutResult>;
}

export interface RenderStrategySupplier<Layout, LayoutResult> {
  readonly renderStrategy: RenderStrategy<Layout, LayoutResult>;
}

export interface DefaultRenderStrategySupplier<Layout, LayoutResult>
  extends RenderStrategySupplier<Layout, LayoutResult> {
  readonly isDefaultRenderStrategy: true;
}

export interface NamedRenderStrategySupplier<Layout, LayoutResult>
  extends RenderStrategySupplier<Layout, LayoutResult> {
  readonly isNamedRenderStrategySupplier: true;
  readonly renderStrategyIdentity: RenderStrategyIdentity;
}

export interface InferredRenderStrategySupplier<Layout, LayoutResult>
  extends RenderStrategySupplier<Layout, LayoutResult> {
  readonly isInferredRenderStrategySupplier: true;
}

export interface FrontmatterRenderStrategySupplier<Layout, LayoutResult>
  extends InferredRenderStrategySupplier<Layout, LayoutResult> {
  readonly isFrontmatterRenderStrategySupplier: true;
  readonly frontmatterRenderStrategyPropertyName: string;
}

export interface ErrorRenderStrategySupplier<Layout, LayoutResult>
  extends DefaultRenderStrategySupplier<Layout, LayoutResult> {
  readonly isErrorRenderStrategySupplier: true;
  readonly renderErrorDiagnostic: string;
}

export interface RenderStrategies {
  readonly defaultRenderStrategySupplier: <Layout, LayoutResult>() =>
    DefaultRenderStrategySupplier<
      Layout,
      LayoutResult
    >;
  readonly namedRenderStrategy: <Layout, LayoutResult>(
    name: RenderStrategyIdentity,
    ddss?: DefaultRenderStrategySupplier<Layout, LayoutResult>,
  ) => RenderStrategySupplier<Layout, LayoutResult>;
  readonly inferredLayoutStrategy: <Layout, LayoutResult>(
    s: Partial<
      | fm.FrontmatterSupplier<fm.UntypedFrontmatter>
      | m.ModelSupplier<m.UntypedModel>
    >,
    ddss?: DefaultRenderStrategySupplier<Layout, LayoutResult>,
  ) => RenderStrategySupplier<Layout, LayoutResult>;
}
