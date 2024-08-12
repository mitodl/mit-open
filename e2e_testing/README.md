# E2E Testing

The E2E Tests bring the web front end and backing services under test and emulate a user interacting with the browser.

They are designed to run in two modes:

- _Pre-release_ - During CI the tests run against locally spun up services including an ephemeral database that includes the Django web service schema migrations plus any test fixture data for the tests to make assertions against.

- _Post-release_ - A subset of the tests can be run against a live environment to sanity check deployments and confirm services are running as expected. These are intended to be non destructive with regard to the database and so should not make changes to data or be dependent on any pre-existing data (see Tag Annotations below).

We are using [Playwright](https://playwright.dev/) as the testing framework. This provides browser instances augmented with Playwright's language API for selecting DOM elements, emulating user interactions and making assertions.

## Testing a User's Perspective

A primary benefit of E2E Testing (also Acceptance Testing in this context) is that the tests have zero or very limited visibility of the internals of the system under test. This yields a focus on the user facing feature set irrespective of the code, facilitating refactor without test rewrite and producing a test suite styled around the product requirements and a test output that describes the product's specification.

The tests then should interpret the rendered UI as would a user or an assistive technology. Historically source code would be annotated with HTML attributes for the tests to select on, or tests would make use of DOM XPaths or CSS selector paths. These approaches should be avoided as they incur a reliance on the implementation detail, can be brittle and do not reflect a user's view of the system. Playwright's best practices include a recommendation to [test user-visible behavior](https://playwright.dev/docs/best-practices#test-user-visible-behavior) and an element [Locator](https://playwright.dev/docs/locators) preference to select on accessibility attributes and textual content. Where practical, this approach should be followed.

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
BASE_URL=https://learn.mit.edu/ yarn test
```

NPM scripts are provided for our RC and Production environments:

```bash
yarn test:rc
yarn test:production
```

A Docker Compose configuration at [docker-compose-e2e-tests.yml](../docker-compose-e2e-tests.yml) provides the minimal run configuration for starting services needed for testing, the Postgres database, the backend web service and our nginx reverse proxy.

Services can be started with:

```bash
docker compose -f docker-compose-e2e-tests.yml up web db nginx
```

The tests themselves are also containerized so the following command will start all services, run the tests and shut down services when the tests have completed:

```bash
docker compose -f docker-compose-e2e-tests.yml up --exit-code-from e2e-tests
```

The Docker Compose configuration includes a container, `build-frontend` to build the front end in production mode, necessary as in development mode Webpack builds the static assets URLs to `od.odl.local`, not available on the Docker network. The project root on your local filesystem is mounted to both this and the `watch` container from the main [docker-compose.yml](../docker-compose.yml) file, so will overwrite - during development you will need the watch container to fire again to produce a development build. To run use:

```bash
docker compose -f docker-compose-e2e-tests.yml up build-frontend
```

This runs the local equivalent:

```bash
NODE_ENV=production yarn build
```

## Data Handling

Applying and tearing down data adds significant overhead to writing tests. This can be minimized by specifying initial fixture data alongside any tests that run against it. The data can be applied to a fresh ephemeral database locally and in CI and can be disposed of after a test run. This also guarantees that tests are dependent only on the codebase and not any data that happens to have been set during an instances lifetime on a hosted environment. We have the added benefit that we do not need to write teardown code to leave the database in its original state.

These test fixtures can be written in JSON and any files in the adjacent [./fixtures](./fixtures) directory will be applied to the database whilst standing up services in CI. The data is in [Django fixture](https://docs.djangoproject.com/en/5.0/howto/initial-data/) format for use with the manage.py [loaddata utility](https://docs.djangoproject.com/en/5.0/ref/django-admin/#loaddata).

The [docker-compose-e2e-tests.yml](../docker-compose-e2e-tests.yml) file includes run commands on the web service to apply the fixtures. As the database is destroyed and created fresh each run, the tests use their own Postgres instance, `e2e_postgres`, to not impact local development. Whilst working on the tests locally, the fixtures can be copied to a running web container and applied with the [./scripts/apply-fixtures.sh](./scripts/apply-fixtures.sh) script.

The tests can also insert data via the API, with the benefit that we adding test coverage for the endpoints. There will be cases where we insert data while testing the UI, such as an admin creating of learning paths or user lists. There is a general preference to test against data that has been applied during the test sequence. The fixtures are particularly useful where data is voluminous and creating via the UI would be slow, also for inserting data for the read only endpoints where data is ingested from other platforms by the ETL jobs.

## Tag Annotations

Playwright provides a mechanism to run only tests [annotated with a specific tag](https://playwright.dev/docs/test-annotations#tag-tests). Any tests intended to be run against live environments for post deployment check should be tagged `@sanity`. As a rule, these tests cannot make assertions against any specific data in the database, not should they do anything that would change the data. We may revisit this if we find there are key user journeys that need to be checked that do change data and perhaps can add additional tags for RC/pre-production stages or use in tandem with some data retention or cleanup strategy.

To run tests with a specific tag, run e.g.:

```bash
yarn test --grep @sanity
```

## CI

A GitHub Actions job runs the full test suite against locally running services.

Test reports deploy to the GitHub Pages site at https://mitodl.github.io/mit-open/playwright-report/.
