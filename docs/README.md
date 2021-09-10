# rf Documentation

- `rf.ts` controls all the actions (using `Taskfile.ts` model) - all opinions
  are maintained in here (starting with `publication.rf.ts` as the profile
  manager).
  - Assume `publication.rf.ts` is configurable through extensions mechanism
- `publication.rf.ts` in the root sets up the publication (the type-safe profile
  configuration)
- `deps.rf.ts` in the root sets up dependencies that the publication will use
- `publication.rf.ts` in any subdirectory overrides whatever is in the root
  `publication.rf.ts` by inheritance, using `../publication.rf.ts` as a
  dependency.
  - Allow `publication.rf.ts` or any other convention to be specified in `rf.ts`
    without magic and without any opinions
  - Allow Design System layout to be created from `publication.rf.ts`
