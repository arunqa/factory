# Resource Factory

![Resource Factory](docs/static/images/factory-hero-large.webp)

Resource Factory is a universal approach to generating and assembling code,
HTML, or other assets that could comprise static sites or engineering artifacts.
Resource Factory is a different way to generate static "sites" where the concept
of a _site_ is an arbitrary construct. A _site_ could be any target group of
generated _files_/_products_/_artifacts_ and not just HTML assets.

Resource Factory's design goals include:

- Information Architecture (IA) driven artifacts which are tightly governed.
- Zero-compromise performance by implementing all dynamic functionality in V8
  through Deno and obviating the need for slow template processing outside of
  V8. The only "templating language" needed on the server side should be modern
  string template literals in TypesScript/Javascript. On the client side we
  encourage use of Web Components and vanilla JS focused on _native HTML_.
- Type-safety from source to destination, including type-safe templates.
- Source/_origination_ flexibility plus _destination_ abstraction.
- Aribtrary rendering strategy to support structured generation of any type of
  products or assets but with batteries-included HTML Design System rendering
  that enforces brand discipline across all generated assets.
- Batteries-included structural routing for type-safe references to generated
  assets.
- Specialized for large number of generated assets with special capabilities
  such as partial site generation (_site fragments_) when most of a target does
  not change often but portions change more frequently.
- Async execution for high performance.
- Support for _Incremental Static Regeneration_, _Distributed Persistent
  Rendering_ and _stale-while-revalidate_.

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

## SSG Caveats

This framework is not about the ease of local edits of a rendering strategy such
as an HTML design system ("DS") but enfocing consistency to a specific chosen
rendering strategy. Because Resource Factory is geared not for small sites but
large publications, type-safety, observability, performance, and enforcement of
design patterns is the main concern.

Flexibility from an engineering perspective is important but flexiblity of
changes to any single resource is not a goal. For example, some static site
generators (SSGs) allow easy changes to HTML output on a per-page basis but if
Resource Factory is used as an SSG we would be more focused on enforcing HTML
pages to adhere to a design system, not optimize for making local changes.

### Content naming conventions

- `name.m1.m2.ts` is used for TypeScript-based content with `m1` and `m2` as
  _modifiers_. Examples include:
  - `name.r.ts` signifies with `.r.` _modifier_ that this TypeScript module
    generates one or more _resources_ of _arbitrary nature_ (e.g. mixed HTML,
    JSON, etc.).
  - `name.html.ts` signifies with `.html` is that this module produces HTML.
  - `name.json.ts` signifies with `.json` is that this module produces JSON.

## Software Supply Chain and Dependencies (SSCD)

- Always pin imports to semver versioned imports and references (_never_ use
  unversioned imports)
- Put production dependencies in `deps.ts` and test dependencies in
  `deps-test.ts`.

# Maintenance

## Software Supply Chain

- Regularly run `find . -name "*.ts" | xargs udd` in the root so that updates
  can be done easily

## TODOs

### Framework

- Incorporate [Design decisions](https://prpl.dev/design-decisions) into docs.
- How can web workers improve rendering performance?
- Use
  [Deno Deploy or PgDCP for Serverless Functions as
  Proxies](https://css-tricks.com/serverless-functions-as-proxies/)
- Integrate [Plausible](https://github.com/plausible/analytics),
  [Fathom](https://github.com/usefathom/fathom) or custom analytics framework
  plus add type-safe Google Analytics into Design System base classes.
  - For tracking click throughs integrate with Funnelytics.io,
    [BPMN Engine](https://github.com/paed01/bpmn-engine) or similar.
  - Review
    [server\-side conversion tracking](https://digiday.com/marketing/wtf-is-server-side-conversion-tracking/)
    to see how we might be able to use routes, aliases, etc. to manage tracking
    and then we can integrate with innovators, suppliers, etc. and our
    publications.
- Integrate [denodash](https://github.com/brianboyko/denodash) for refinery
  calls, enhancing EventEmitter, finding nodes in a tree, and a variety of other
  useful functional programming uses.
- Integrate
  [Islands Architecture](https://jasonformat.com/islands-architecture/)
- Evaluate [Snel](https://github.com/crewdevio/Snel) for Svelte integration
- [Marko](https://markojs.com/) is a similar idea but only supports NPM
- Evaluate [xstate](https://cdn.skypack.dev/xstate) to incorporate FSMs where
  appropriate.

### Context

- Add `Partial<govn.RenderContextSupplier<*Context>>` to HtmlLayout, JsonLayout,
  etc so that pages, partials, etc. can easily see which "environment" like
  production, sandbox, devl, test, etc. they are running in.
  - This is especially helpful to show banners across the top/bottom of sites in
    dev/test/sandbox environments for clarity.
  - Allow contexts to be carried into ClientCargo so generated web assets can
    use `location.hostname` as a way of indicating devl/sandbox/prod contexts.

### Models

- Use [Ajv JSON schema validator](https://ajv.js.org/) to validate models since
  need to be type-safe but fully extensible across resources.

### Redirects

- Implement special link shortener and asset trackingredirects for web assets.
  This would allow `domain.com/x/ABC` type definitions to allow automatic
  generation of redirects tied to shortcode (`ABC`). Also, it would allow easy
  implementation of [Scarf Gateway](https://about.scarf.sh/scarf-gateway) style
  resource tracking (see related [Nomia](https://github.com/scarf-sh/nomia/)
  project for universal resource namespaces).

### Visualization

- [Livemark](https://github.com/frictionlessdata/livemark) is a static page
  generator that extends Markdown with interactive charts, tables, scripts, and
  more. Should be a good comparable for us to incorporate into Factory.

### Database Functionality

- [Evidence](https://github.com/evidence-dev/evidence) enables analysts to
  deliver a polished business intelligence system using SQL and markdown. This
  is a great approach that we should integrate.
  [Hacker News Discussion](https://news.ycombinator.com/item?id=28304781).
- Use [Rakam](https://rakam.io/) as a guide to define our data as code and
  enable our analytics teams to get insights from your data without SQL. Check
  out [metriql](https://metriql.com/) as a way to integrate Metrics across
  databases - as a PgDCP source/sink.

### Unit tests using Resource Factory's documentation

- Implement URL fetch originator that can pull in Markdown files like README.md
  from any source. We can then demo how we can integrate, for example, the
  design-system/README.md directly into an Resource Factory generated site. This
  way Markdown can be kept anywhere and included through URLs directly into
  publications.
- Review [Astro](https://docs.astro.build/getting-started), Hugo, Lume, and
  other SSG documentation to craft our unit tests. The most advanced
  functionality should come from our own documentation. This means creating data
  in SQLite to mimic DB behavior.

### Route and file system path-specific configuration

- Use [astring](https://www.skypack.dev/view/astring) JavaScript code generator
  by building ESTree-compliant ASTs for JavaScript-based routes and other
  artifacts. For example, we can create a `routes.js` which would be similar to
  `routes.json` except in JavaScript instead of JSON. By including JavaScript
  instead of JSON we can have easier use within HTML files and be able to catch
  reference errors when structures change.
  - Similar to functionality in NEFS Sparx which generated type-safe code for
    custom sites.
  - Also, we could consider generating TypeScript by adding some typing on top
    of the generated JS. Similar to how
    [GSD](https://github.com/gov-suite/governed-structured-data) operates; or,
    we could just use GSD out of the box?
- Implement `.Resource Factory.ts` type-safe _profiles_ which will include all
  extensions and supply configurations such as `layout` and other rules. Instead
  of forcing all rules in a common configuration, allow `.Resource Factory.ts`
  at any route to override any configuration value by merging properties with
  ancestors. This will be referred to as the Resource Factory _Route Profile_ or
  _Resource Profile_.

### Routes and Trees

- Introduce namespaces into routes so they can indicate where they fit into
  multiple systems (e.g. more than one statically generate site or multiple
  projects that can be built without each others' knowledge).
  - [Nomia](https://github.com/scarf-sh/nomia/) is an interesting project for
    universal resource namespaces and might be worth integrating.
- Incorporate https://deno.land/x/urlcat for type-safe URLs in Routes
- Implement route computation using
  [path-to-regexp.compile()](https://github.com/pillarjs/path-to-regexp/blob/master/src/index.ts#L252)
  - Check out https://web.dev/urlpattern/ for additional ideas
  - Check out https://www.skypack.dev/view/regexparam which is much smaller
    could potentially be incorporated directly without becoming a source
    dependency.
- Read Astro's
  [File\-based routing, inspired by
  Next\.js](https://astro.build/blog/astro-019#file-based-routing-inspired-by-nextjs)
  article to understand how routing is defined by Next.js SvelteKit to allow
  similar patterns to be passed into originators and resource constructors.
- Consider generating UUIDv4 identities for each resource's body content so that
  body content can be "fingerprinted" for caching and testing for changes
  without using a revision control system. This will allow resources to be
  portable across publications.
- Consider generating UUIDv4 identities for each route tree node so that the
  same route from any partial sites will generate the same ID. This will allow
  routes to know when they have been "moved".
- Implement aliasing so that parsed routes can indicate that they "belong" to a
  different parent than their physical location. These are almost like parent
  aliases.
  - Consider allowing setting `parents` so that the same resource could insert
    itself into multiple parents. Instead of being an alias, the same resource
    could be in two routes.
  - This capability might allow better partial routes which would allow a child
    to insert itself to a parent route, if it existed, and ignore if it did not
    exist.
- Allow directories to become routes without necessarily tying it to a resource
  - Should directories themselves become originators (resource factories)?

### Frontmatter

- Use
  [Superstruct Describing Types](https://docs.superstructjs.org/guides/06-using-typescript#describing-types)
  feature to create a frontmatter guard-based "typer" that allows untyped
  frontmatter to be turned into a typed structure consumable by resources.
  - Use this for RouteSupplier route unit declarations that will be used to
    build RouteTree nodes
  - Use this for LayoutSupplier declarations
  - Consider [Ajv JSON schema validator](https://ajv.js.org/) for validating
    frontmatter in JS instead of just TypeScript.

### Originators

### Refiners

### Type-safety

### Lint

- When building clean after `deno-clear-caches`, getting
  `Warning Implicitly using latest version (v1.0) for https://deno.land/x/hierarkey/mod.ts`
  from one of the libraries. Need to figure out which one and pin it to a
  specific version (see SSCD notes).

# References

- [Bedrock: The SQLitening](https://mozilla.github.io/meao/2018/03/28/bedrock-the-sqlitening/)
- [The Baked Data architectural pattern](https://simonwillison.net/2021/Jul/28/baked-data/)
