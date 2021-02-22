** Installing/linking dependencies **
1. Run `npm run bootstrap`

** Hoisting a new dependency **
1. Add dependency to the `lerna.json`.
2. Run `npm run bootstrap`. Lerna will bail if version of the dependency does not match in all packages.

** Using monorepo dependency in one of the packages **
1. Add dependency to the `package.json`
2. Run `npm run bootstrap` at top level
