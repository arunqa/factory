---
route:
  unit: index
  label: Home
layout:
  identity: lds/page/prime
  diagnostics: true
  redirectConsoleToHTML: true
---

# Resource Factory

![Resource Factory](assets/images/factory-hero-large.webp)

Resource Factory is a universal approach to generating and assembling code,
HTML, or other assets that could comprise static sites or engineering artifacts.
Resource Factory is a different way to generate static "sites" where the concept
of a _site_ is an arbitrary construct. A _site_ could be any target group of
generated _files_/_products_/_artifacts_ and not just HTML assets.

Resource Factory's design goals include:

- Information Architecture (IA) driven artifacts which are tightly governed
- Zero-compromise performance by implementing all dynamic functionality in V8
  through Deno and obviating the need for slow template processing outside of
  V8.
- Type-safety from source to destination, including type-safe templates
- Source/_origination_ flexibility plus _destination_ abstraction
- Aribtrary rendering strategy to support structured generation of any type of
  products or assets but with batteries-included HTML Design System rendering
  that enforces brand discipline across all generated assets
- Batteries-included structural routing for type-safe references to generated
  assets
- Specialized for large number of generated assets with special capabilities
  such as partial site generation (_site fragments_) when most of a target does
  not change often but portions change more frequently.
- Async execution for high performance

Resource Factory's purpose is to take raw materials called _resources_ from file
systems, databases, or other sources and create _finished products_ such as
HTML, SQL, or arbitrary artifact. The _products_ can be persisted to file
systems or other destinations or futher processed by other systems.

Resource Factory works with reasonable type-safety using three key concepts:

```
Sources             Acquired data          Mutatable resources         Terminal resources
┌──────────────┐    ┌───────────────┐ 1:1  ┌──────────────────┐  1:1   ┌──────────────────┐
│ File Systems ├───►│  Origination  ├─────►│    Refinement    ├───────►│       Render     │
│ Databases    │    │ ("factories") │ 1:n  │  ("refineries")  │  1:n   │   ("renderers")  │
│ URLs         │    └───────────────┘   ┌─►└──────┬───────┬───┘  n:n   └─────────┬────────┘
│ ...          │            ▲           │         │       │            Immutable │ Design Systems,
└──────────────┘            │           └─────────┘       │           Refineries │ Persisters, etc.
                            │            recursive        │                      │
                            │            refinement       │                      │ Destinations
                            └─────────────────────────────┘              ┌───────▼──────┐
                             recursive originators                       │ File Systems │
                             can "fan out" additional                    │ ...          │
                             resources in refineries                     └──────────────┘
```

- **Origination**. _Factory_ objects, called **originators**, supply _resource
  constructors_. A resource could be any structured or unstructured data coming
  from any arbitrary source. The factory terminology matches the GoF creational
  pattern that uses factory methods to handle construction of the resources
  which will be _refined_ and _produced_ in the following steps.
  - `FileSysGlobsOriginator` is a built-in Resource Factory originator which
    creates resource constructors for files in the local file system.
  - Other originators could pull resources from databases, fetch from URLs, or
    any arbitrary sources.
- **Refinement**. _Transformation_ objects, called **refineries**, supply
  _resource mutators_. Refineries operate in a pipeline and can mutate resources
  as many times as required to reach a _terminal state_.
  - Refineries:
    - Use _resource constructors_ created by originators to construct instances.
    - Perform transformations to further _refine_ or mutate the instances.
    - Produce additional factories to "fan out" and recursively produce more
      resources which can then be refined.
  - `UniversalRefinery` is a built-in Resource Factory refinery which constructs
    resources from any orginator (such as `FileSysGlobsOriginator`) and applies
    arbitrary instance mutations.
- **Finished Product**. _Refined instances_ whose mutations have reached their
  _terminal resource stage_ are fed to **Renderers**. _Renderers_ use one or
  more _render strategies_ to take a terminal resource and product a _rendered_
  resource. Rendered resources can then be persisted to a file system or any
  arbitrary destination.
