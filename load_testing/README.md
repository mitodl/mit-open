## Load Testing

#### Locust

The load testing system uses [Locust](https://docs.locust.io/en/stable/index.html) to run the load tests against the APIs. The entrypoint for this is `locustfile.py`. Locust automatically picks up the testing configuration based on subclassing things, you can read the docs for further details.

#### Running

- Add `load-testing` to your `COMPOSE_PROFILES` setting.
- Run `docker compose up` or `docker compose up locust locust-worker` (a more minimal set of services)
- Go to http://localhost:8089/ and you should see the web UI for Locust.
- Set the options you want to test (100 users is reasonable for local tests) and click Start
- If you're testing against a backend that isn't reachable through the `nginx` hostname, you'll need to specify the alternative hostname.
  - You can use this to test against deployed environments.
