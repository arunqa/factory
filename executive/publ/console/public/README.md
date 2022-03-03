# Modern HTML Playbook

## Philosophy

TODO: this philosophical summary is more for "apps" but we need to run performance figures to have it work for modern SEO-friendly content sites.

- pure HTML, use what's in HTML5 and don't reinvent something for your own needs
  - being highly dynamic in content, styling, and structure is a Good Thing but keep in mind the [evergreen Googlebot](https://developers.google.com/search/blog/2019/05/the-new-evergreen-googlebot) rules because SEO-friendliness still matters
- zero builds, no special need for generators if we keep the HTML simple, regular, and parsable
  - for linting and analysis use widely available HTML validators
- zero routes, or "the _filesystem_ is our _router_"
  - embrace the file system as the router, especially symlinks for aliasing, file names, and `path.ctx.js` for elaboration
  - don't force special directories or locations for files, use filename modifiers for categorization (e.g. `path.ctx.js` vs. `path.lib.js`)
  - route units should be in <meta name="route.unit" content="{...JSON...}">
  - routes should be in <meta name="route" content="{...JSON...}">
- fully static, serve everything possible and then dynamically modify after Lighthouse score elements pass (LCP, etc.)
  - to maintain consistency, perform dynamic styling on top of semantic tags like `<main>`, `<article>`, etc. at runtime instead of sprinkling classes and styles directly into the markup; assume the markup is for structure and content, not styling. Since we're not building a framework but a philosophical foundation for our own custom sites this shouldn't be a problem.
- assuming you we need to support only modern browsers, use web components and custom elements for all dynamic content
- assume HTTP/2 is more widely available so many, small JS/CSS network calls are fine, instead of server-side builds

## Rules

This section describes various _requirements_. If a rule is optional, it's called a _guideline_. 

### Use CDNs or Symlink to our scripts we do not own

In a typical creators sandbox setup `./universal.lib.js` is a symlink to Resource Factory's `core/design-system/universal/client-cargo/script/universal.js` module. By creating a symlink it makes development easy but also eases deployment because if it's `tar.gz`'d the symlink just becomes a regular file. **TODO**: the primary issue is minimization, something we'll need to solve later if performance testing shows it's necessary.

### Typical HTML Stucture and Layout

This is the _minimal pattern_ and, although devoid of any content, is a perfectly valid page that will render with headers, footers, and other page decoration:

```html
<!DOCTYPE html>
<html lang="en" style="display:none">

<head>
    <meta charset="utf-8">
    <link rel="stylesheet" type="text/css" href="./path.actuate.css" />
    <script src="./path.actuate.js" type="module"></script>
</head>

</html>
```

Below is a more useful page and shows optional `<meta>` data in `<head>` and some content. [index.pattern.html](index.pattern.html) contains our typical HTML structure and layout _pattern_. 

```html
<!DOCTYPE html>
<html lang="en" style="display:none"> <!-- see FOUC section about why display:none is used -->

<!-- keep the `<head>` section trim with just the minimum tags, do all other page in Javascript dynamically -->
<head>
    <meta charset="utf-8">                                              <!-- all other "standard" <meta> tags should be in *.actuate.js -->
    <meta name="route.unit" content="{unit: 'x'}">                      <!-- for navigation, each page has a RouteUnit instance if not matching fs-style-route -->
    <link rel="stylesheet" type="text/css" href="./path.actuate.css" /> <!-- use @import() in this .css to pull in other css -->
    <script src="./path.actuate.js" type="module"></script>             <!-- use module imports in this .js to pull in other js -->
</head>

<body data-layout="auto"> <!-- if data-layout is blank, it will be treated same as "auto" during actuation -->    
    <!-- always use Semantic tags whenever possible (https://html.spec.whatwg.org/multipage/sections.html#the-article-element) -->
    <main>
        <article>
            <header><h1>Article heading</h1></header> <!-- the first <header> tag in <body> will usually be the page title, automatically -->
            <section>
                <header>Section heading</header> <!-- note use of <header> for section now, not article -->
            </section>
        </article>
    </main>
</body>

</html>
```

### Preventing Flash of Unstyled Content (FOUC)

Because we have a philosophy of "zero builds", pure HTML, and as much static content as possible we sometimes have to load HTML before styling and then style it dynamically. This can sometimes result in what's called flash of unstyled content (FOUC). To help prevent FOUC we initially hide the entire page (`<html>` tag) and then unhide it after content styling is completed post-page-load. Thus, we have this standard HTML requirement:

```html
<html lang="en" style="display:none">
```

And then in one of our Javascript execution threads we must have it's twin:

```js
document.addEventListener("DOMContentLoaded", function () {
    // in case we're preventing flash of unstyled content (FOUC) by hiding the HTML tag now, we're ready to show it again -->
    document.getElementsByTagName("html")[0].style.display = "block";
});
```

## Conventions

Conventions that the server should honor should be based on `filename.m1.m2.extn`, where `m1`, `m2` are _optional_ **modifiers**, allowing files to sit in any directory. Being diligent towards conventions of _modifiers_ and _extensions_ allows server-side deployment services like web servers, proxy servers, etc. to setup rules tied to _modifiers_ and _extensions_ rather than directories. 

- `*.pattern.{html,css,js,etc.}` convention like `index.pattern.html` for "templates" or "starters" (or other design patterns)
- `*.lib.js` convention libraries that only export functionality but have no side effects (use `path.lib.js` convention if the library is useful for that path and below)
- `path.actuate.{js,css}` convention for page initiation, actuation, activation, or general page "bootstrapping"
    - path.actuate.js is used to "complete" a static HTML page dynamically
      - "registers" a page on the server
      - "serves" immediate context information that statically cannot be determined on the client (whatever can only be learned from server)
      - "provisions" an SSE or websocket tunnel if necessary
- `*.asset.{js,css}` convention (could go anywhere, no need for /assets/* or /asset/script, /asset/image, etc.)
- `*.stream.{json,js,csv}?params` convention for APIs or "streamed" content (dynamic JS is also a "stream"), all served APIs have their format/extension
  - `path.ctx.stream.js` for server-supplied context for given path (may be static or dynamic, depending on deployment)
    - e.g. `./path.ctx.stream.js` always supplies any current page dynamic "context", if any, for the current path (shared by all pages in the path)
      - `./path.ctx.stream.js` can be made inheritable using `./path.ctx.stream.js?inherit=auto.server&inherit-ancestors=3` if the server knows what to do using deployment symlinks or something like the following if the client wants to do it manually (if inheritance should be done automatically at the server then it can be turned off using something like `./path.ctx.stream.js?inherit=no`):

        ```js
        const ancestorTarget = 3; // build an array like ['../', '../../', '../../../']
        const ancestors = Array(ancestorsTarget).map((_, i) => '../'.repeat(ancestorTarget-i));
        $script.ready(['./', ...ancestors].map(p => `${p}path.ctx.stream.js`), function () {
            // do whatever you want
        }, function(depsNotFound) {
            // whichever ones were not found would be in the depsNotFound array
        })
        ```        
- `/health.json` for site health (https://tools.ietf.org/id/draft-inadarei-api-health-check-06.html)
- `/metrics.txt` for site metrics (Prometheus exposition format)


## Guidelines

* Use [HTML syntax guidelines](https://github.com/LeaVerou/html-syntax-guidelines) and the various guides referenced in it for our guidelines.
* remove coupling by ensuring event driven architecture (EDA) with event listeners, not specific callbacks or globals
* use HTML5 semantic elements like <header>, <nav>, <main>, <article>, <aside>, <footer>, etc. and not make up our own semantics
* use custom elements with prefixes like
    - <site-*> for site-wide element (inherited by modules)
    - <module-*> for site-module and descendants(inherited by paths)
    - <path-*> for module-path and descendants (inherited by subpaths)
* if defining custom elements, after <site-*>, <module-*>, <path-*> use HTML5 semantic tags like module-header, path-article, etc. and don't make up your own

