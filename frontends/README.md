## MIT Open Frontend

## Yarn Workspaces

This project uses [yarn workspaces](https://yarnpkg.com/features/workspaces) to help organize frontend code. Yarn workspaces are a tool for managing node packages, in this case _local_ node packages.

Each subdirectory of `/frontends` is a yarn workspace:

```
frontends/
├─ mit-open/                 ... built by webpack and served by django
├─ package1/                 ... a dependency of app/
├─ package2/
├─ etc...
```

To aid in separating concerns, we should strive to write code with independent, clearly defined contracts that can be extracted to isolated packages (workspaces) and re-used throughout this project.

**Flow vs Typescript:** The majority of the frontend code in this project is in the `mit-open` workspace and is written in Javascript + FlowType. We are in the process of migrating the codebase to Typescript and all other packages should be written in Typescript.

## Running Yarn Commands

Commands can be run for all workspaces or for a specific workspace. For example:

```bash
# Lint all workspaces
> docker compose run --rm watch yarn run lint-fix
# Run the lint-fix defined in a specific workspace named "my-wrkspace"
> Docker compose run --rm watch yarn workspace my-workspace run lint-fix
```

Most workspaces are shared dependencies built using typescript and tested with jest. Generally, these workspaces do not define their own linting and testing commands, instead using the `global:lint-fix`, etc, commands defined at the project root. For example:

```bash
# Lint the ol-utilities workspace
> docker compose run --rm watch yarn workspace ol-utilities run global:lint-fix
```

Again, `global:lint-fix` is defined at the root workspace, not within `ol-utilities`. This works because [yarn commands containing a colon can be run from any workspace](https://yarnpkg.com/getting-started/qa#how-to-share-scripts-between-workspaces).

## Frontend Development

### Docker Compose stack

The frontend and backend stack can be started locally for development with Docker compose:

```bash
docker compose up
```

For front end development, at minumum we need these containers.

```bash
docker compose up nginx web db watch
```

In this mode, the watch container starts Webpack Dev Server and listens for changes, and building the front end to the local filesystem at `./frontends/mit-open/build`. This is mounted to the `nginx` container for it to serve the static bundle, while routing backend paths to the `web` service.

The application is served at `http://localhost:8063`.

### Local Frontend Dev Server with Local Backend

The `watch` container can be slow to respond to changes to the filesystem mounted onto Docker. If [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) is slow for you, we can run Wepback Dev Server directly outside of Docker. Dev Server proxies API requests through to a locally running backend stack.

Run the front end with:

```bash
yarn watch
```

At minimum we need these containers for the backend:

```bash
docker compose up nginx web db
```

The application is served at `http://localhost:8062`, using the API hosted on your local Docker.

### Local Frontend Dev Server proxying to RC or Prod

When working on the front end in isolation or to test changes against APIs already running in RC, the frontend dev server is configured to run against our hosted RC API without running the backend stack locally.

Run the front end with:

```bash
yarn watch:rc
```

The front end is served at `http://localhost:8062`, using the API hosted on RC.
