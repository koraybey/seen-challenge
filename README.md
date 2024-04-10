## Summary

This project contains the solutions to the back-end challenge provided by [Seen](https://seen.com/) engineering team.

## Components

| Component         | Library                                                                                               |
| :---------------- | :---------------------------------------------------------------------------------------------------- |
| Web server        | [actix-web](https://fastify.dev/)                                                                     |
| Schema validation | [Zod](https://zod.dev/) and [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) |
| Tests             | [Jest](https://jestjs.io/) and [supertest](https://github.com/ladjs/supertest)                        |
| Compiler          | [tsup](https://tsup.egoist.dev/) and [Babel](https://babeljs.io/)                                     |

## Setting up the project and running the server

This project uses [Node.js](https://nodejs.org/en) and [Yarn](https://classic.yarnpkg.com/).

Install dependencies, build and start the server by running:

```shell
yarn # npx i
yarn build # npx build
yarn start # npx start
```

Project also contains a `.tool-versions` file which specifies node runtime for [asdf](https://asdf-vm.com/).
I personally do not use globally installed runtimes. It almost always lead to conflicts on large projects.
If you want to use asdf to manage runtime versions, install it and run:

```shell
asdf plugin add nodejs
asdf install
```

I leave it to the reader to decide what works the best for their environment.

## Checks, tests and code quality

-   Run `yarn test` or `npm test` to compile and run tests
-   Run `yarn tsc` for TypeScript compiler (emitting is currently disabled in favour of `tsup` compiler)
-   Run `yarn lint` for linting

### Code quality

This project relies on [eslint](https://eslint.org/) to enforce linting rules described in `eslint.config.cjs` file. [Prettier](https://prettier.io/docs/en/precommit.html) run at pre-commit phase to prettify the code and ensure commit messages follow conventions set by [conventional commits](https://www.conventionalcommits.org/).

### Workflows checks

GitHub Workflow file also specifies the checks to run when a [pull request is created](https://github.com/koraybey/seen-challenge/pull/1). Currently, this file contains the checks for tests, eslint and TypeScript.
You may view and edit the configuration by navigating to `.github/workflows/checks.yml`.

If you edit these tests, you do not have to open a PR to check if your changes work correctly.
Install [act](https://github.com/nektos/act) and run `act` to run these checks locally before submission.

Steps vary depending on the architecture. You may need to specify your architecture with `--container-architecture` flag.
