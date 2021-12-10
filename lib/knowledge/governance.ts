export type TermNamespace = string;
export type TermIdentity = string;
export type TermLabel = string;

export type TermDefn = [
  term: TermIdentity,
  label?: TermLabel,
  namespace?: TermNamespace,
];

export interface TermElaboration {
  readonly term: TermIdentity;
  readonly label?: TermLabel;
  readonly namespace?: TermNamespace;
}

export type Term = TermIdentity | TermDefn | TermElaboration;

export type Folksonomy = Term | Term[];
export type Taxonomy = Term | Term[];
