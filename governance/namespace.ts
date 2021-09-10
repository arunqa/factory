export type NamespaceURI = string;

export interface NamespacesSupplier {
  readonly namespaceURIs: NamespaceURI[];
}
