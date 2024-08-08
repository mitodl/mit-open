## MIT Learn Frontend

## Yarn Workspaces

This project uses [yarn workspaces](https://yarnpkg.com/features/workspaces) to help organize frontend code. Yarn workspaces are a tool for managing node packages, in this case _local_ node packages.

Each subdirectory of `/frontends` is a yarn workspace:

```
frontends/
├─ mit-learn/                 ... built by webpack and served by django
├─ package1/                 ... a dependency of app/
├─ package2/
├─ etc...
```

To aid in separating concerns, we should strive to write code with independent, clearly defined contracts that can be extracted to isolated packages (workspaces) and re-used throughout this project.

**Flow vs Typescript:** The majority of the frontend code in this project is in the `mit-learn` workspace and is written in Javascript + FlowType. We are in the process of migrating the codebase to Typescript and all other packages should be written in Typescript.

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

### Running the frontend on host

The docker containers in MIT Learn have associated [profiles](https://docs.docker.com/compose/profiles/). Our `.env.example` file recommends setting `COMPOSE_PROFILES=backend,frontend` in your `.env` file. In this way, all containers will start automatically when you run `docker compose up`.

You may want to run only the backend containers in docker and run the frontend on your host instead. Reasons to do this include:

- performance—webpack and tests are both faster on hosts.
- developing with local branches of external dependencies

To run just the backend containers, set `COMPOSE_PROFILES=backend`. You will need to start the frontend containers manually via

```bash
yarn watch
```

**Warning:** Depending on your host operating system (e.g., Macs), node packages installed on your host vs on the container may not be compatible. You may need to reinstall node_modules in order to run on host.
