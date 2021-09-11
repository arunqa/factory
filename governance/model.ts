/**
 * Models are portions of content in resources that are used to make decisions
 * about _behavior_ stemming _from content_. For example, routes use _models_
 * (instead of content) so that multiple types of content can be modeled with
 * common behavior. Models are about determining behavior when the actual
 * text/content is less important than the _structure_ of the content.
 */
export interface ModelSupplier<Model> {
  readonly model: Model;
}

export type ModelIdentity = string;

export interface IdentifiableModelSupplier<Model> extends ModelSupplier<Model> {
  readonly modelIdentity: ModelIdentity;
}
