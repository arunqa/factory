# Resource Factory Helpers Library

The modules in this library are designed to help *Resource Factory*-based applications but should not rely on RF. Because they are independent helpers, the modules in this library should not have any RF dependencies so they can be used by non-RF applications as well. 

Any modules that rely on RF should be in `core`. Sub-modules in this library (e.g. `cache`, `sql`, `git`, etc.) should generally be independent of each other as well, keeping dependencies to a minimum.
