# E2E Testing

The E2E Tests bring the web front end and backing services under test and emulate a user interacting with the browser.

They are designed to run in two modes:

- _Pre-release_ - During CI the tests run against locally spun up services including an ephemeral database that includes the Django web service schema migrations plus any test fixture data for the tests to make assertions against.

- _Post-release_ - A subset of the tests can be run against a live environment to sanity check deployments and confirm services are running as expected. These are intended to be non destructive with regard to the database and so should not make changes to data or be dependent on any pre-existing data (see Tag Annotations below).

We are using [Playwright](https://playwright.dev/) as the testing framework. This provides browser instances augmented with Playwright's language API for selecting DOM elements, emulating user interactions and making assertions.

## Testing a User's Perspective

A primary benefit of E2E Testing (also Acceptance Testing in this context) is that the tests have zero or very limited visibility of the internals of the system under test. This yields a focus on the user facing feature set irrespective of the code, facilitating refactor without test rewrite and producing a test suite styled around the product requirements and a test output that describes the product's specification.

The tests then should interpret the rendered UI as would a user or an assistive technology. Typically source code would be annotated with HTML attributes for the tests to select on, or tests would make use of DOM XPaths or CSS selector paths. These approaches should be avoided as they incur a reliance on the implementation detail, can be brittle and do not reflect a user's view of the system. Playwright's best practices include a recommendation to [test user-visible behavior](https://playwright.dev/docs/best-practices#test-user-visible-behavior) and an element [Locator](https://playwright.dev/docs/locators) preference to select on accessibility attributes and textual content. Where practical, this approach should be followed.

## Development

Playwright provides a [UI workbench](https://playwright.dev/docs/test-ui-mode) for running and debugging tests during development. This can be started from the `e2e_testing` directory with:

```bash
yarn start
```

For headless testing from the command line and on CI, we can run the tests with:

```bash
yarn test
```

To target specific environments, set `BASE_URL` on the environment, e.g:

```bash
BASE_URL=https://mitopen.odl.mit.edu/ yarn test
```

NPM scripts are provided for our RC and Production environments:

```bash
yarn test:rc
yarn test:production
```

A Docker Compose configuration at [../docker-compose-e2e-tests.yml](../docker-compose-e2e-tests.yml) provides the minimal run configuration for starting services needed for testing, the Postgres database, the backend web service and our nginx reverse proxy:

Services can be started with:

```bash
docker compose -f docker-compose-e2e-tests.yml up web db nginx
```

The tests themselves are also containerized so the following command will start all services, run the tests and shut down services when the tests have completed:

```bash
docker compose -f docker-compose-e2e-tests.yml up --exit-code-from e2e-tests
```

## Data Handling

Applying and tearing down data adds significant overhead to writing tests. This can be minimized by writing SQL alongside any tests that are expecting specific data, that can be applied to a fresh ephemeral database locally and in CI that is disposed of after a test run. This also guarantees that tests are dependent only on the codebase and not any data that happens to have been set during an instances lifetime on a hosted environment. We have the added benefit that we do not need to write teardown code to leave the database in its original state.

These test fixtures can be written in plain SQL and any files in the adjacent [./fixtures](./fixtures) directory will be applied to the database whilst standing up services in CI. As a suggestion, SQL inserts can be written in [JSON format](https://www.postgresql.org/docs/9.6/functions-json.html) for readability.

There is a script at [./scripts/apply-fixtures.sh](./scripts/apply-fixtures.sh) that will apply these to a database service named `db` running via Docker Compose, or a single file can be copied to the container and applied with e.g.:

```bash
docker compose cp e2e_testing/fixtures/example.sql db:/example.sql
docker compose exec -u postgres db psql postgres postgres -f /example.sql
```

## Tag Annotations

Playwright provides a mechanism to run only tests [annotated with a specific tag](https://playwright.dev/docs/test-annotations#tag-tests). Any tests intended to be run against live environments for post deployment check should be tagged `@sanity`. As a rule, these tests cannot make assertions against any specific data in the database, not should they do anything that would change the data. We may revisit this if we find there are key user journeys that need to be checked that do change data and perhaps can add additional tags for RC/pre-production stages or use in tandem with some data retention or cleanup strategy.

To run tests with a specific tag, run e.g.:

```bash
yarn test --grep @sanity
```

## CI

A GitHub Actions job runs the full test suite against locally running services.

Test reports deploy to the GitHub Pages site at https://mitodl.github.io/mit-open/playwright-report/.
