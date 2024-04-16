## Summary

This project contains the solutions to the back-end challenge provided by [Seen](https://seen.com/) engineering team.

## Components

| Component         | Library                                                                                               |
| :---------------- | :---------------------------------------------------------------------------------------------------- |
| Web server        | [fastify](https://fastify.dev/)                                                                       |
| Schema validation | [Zod](https://zod.dev/) and [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) |
| Tests             | [Jest](https://jestjs.io/) and [supertest](https://github.com/ladjs/supertest)                        |
| Compiler          | [tsup](https://tsup.egoist.dev/) and [Babel](https://babeljs.io/)                                     |

## Setting up the project and running the server

Requires [Node.js](https://nodejs.org/en) (>=18) and [Yarn](https://classic.yarnpkg.com/).

Install dependencies, build and start the server by running:

```shell
yarn
yarn build
yarn start
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

-   Run `yarn test` to compile and run tests
-   Run `yarn tsc` for TypeScript compiler (emitting is currently disabled in favour of `tsup` compiler)
-   Run `yarn lint` for linting

### Code quality

This project relies on [eslint](https://eslint.org/) to enforce linting rules described in `eslint.config.cjs` file. [Prettier](https://prettier.io/docs/en/precommit.html) run at pre-commit phase to prettify the code and ensure commit messages follow conventions set by [conventional commits](https://www.conventionalcommits.org/).

### Workflow checks

GitHub Workflow file also specifies the checks to run when a [pull request is created](https://github.com/koraybey/seen-challenge/pull/1). Currently, this file contains the checks for tests, eslint and TypeScript.
You may view and edit the configuration by navigating to `.github/workflows/checks.yml`.

If you edit these tests, you do not have to open a PR to check if your changes work correctly.
Install [act](https://github.com/nektos/act) and run `act` to run these checks locally before submission.

Steps vary depending on the architecture. You may need to specify your architecture with `--container-architecture` flag.

## Routes

### /relatedCustomers/:customerId

Retrieve related customers for each `customerId`

```shell
curl -H "Content-Type: application/json" -X GET localhost:3000/relatedCustomers/3
```

_(In the challenge dataset, all customers from `relatedCustomers/3` to `relatedCustomers/7` are related.)_

### /transactions/:customerId

Retrieve aggregated transactions for each `customerId`

```shell
curl -H "Content-Type: application/json" -X GET localhost:3000/transactions/1
```

## Assumptions

-   Application integrity is verified and request comes from a legitimate sender

In production, application integrity is determined by validating the JWT token included with the request. This token must be signed by a remote app attestation service independently, with key known to the backend. If JWT token is signed with an unknown key, backend should determine that the request is unauthorized and send 401.

The solution assumes that all requests are authorized.

-   One API exposes two routes

Challenge instructions mention building two APIs to serve the solutions. However, I decided to take the liberty and create one API with two routes to reduce boilerplate code I have to write for two APIs.

-   No database or persistent storage

Each request will refetch the data from `https://cdn.seen.com/challenge/transactions-v2.json` endpoint.

-   No process load measuring and handling
-   No rate limiting
