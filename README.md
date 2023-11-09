# MIT Open

This application provides a central interface from which learners can browse MIT courses.

**SECTIONS**

1. [Initial Setup](#initial-setup)
1. [Code Generation](#code-generation)
1. [Committing & Formatting](#committing-&-formatting)
1. [Optional Setup](#optional-setup)

## Initial Setup

MIT Open follows the same [initial setup steps outlined in the common OL web app guide](https://mitodl.github.io/handbook/how-to/common-web-app-guide.html).
Run through those steps **including the addition of `/etc/hosts` aliases and the optional step for running the
`createsuperuser` command**.

### Configure required `.env` settings

The following settings must be configured before running the app:

- `INDEXING_API_USERNAME`

  At least to start out, this should be set to the username of the superuser
  you created above.

- `MAILGUN_KEY` and `MAILGUN_SENDER_DOMAIN`

  You can set these values to any non-empty string value if email-sending functionality
  is not needed. It's recommended that you eventually configure the site to be able
  to send emails. Those configuration steps can be found [below](#enabling-email).

- `MITOPEN_HOSTNAME`

  Sets the hostname required by webpack for building the frontend. Should likely be whatever you set
  the host to in your /etc/hosts or the hostname that you're accessing it from. Likely `od.odl.local`.

### Loading Data

Run the following to load platforms, departments, and offers. This populates the database with the fixture files contained in [learning_resources/fixtures](learning_resources/fixtures). Note that you will first need to run the Django models to schema migrations detailed in the [Handbook Initial Setup](https://mitodl.github.io/handbook/how-to/common-web-app-guide.html#3-create-database-tables-from-the-django-models) step.

```bash
docker compose run --rm web python manage.py loaddata platforms departments offered_by
```

The MIT Open platform aggregates data from many sources. These data are populated by ETL (extract, transform, load) pipelines that run automatically on a regular schedule. Django [management commands](https://docs.djangoproject.com/en/4.2/howto/custom-management-commands/) are also available to force the pipelines to run—particularly useful for local development.

To load data from [xpro](https://github.com/mitodl/mitxpro), for example, ensure you have the relevant environment variables

```
XPRO_CATALOG_API_URL
XPRO_COURSES_API_URL
```

and run

```bash
docker compose run --rm web python manage.py backpopulate_xpro_data
```

See [learning_resources/management/commands](learning_resources/management/commands) and [open_discussions/settings_course_etl.py](open_discussions/settings_course_etl.py) for more ETL commands and their relevant environment variables.

## Code Generation

MIT Open uses [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/) to generate and OpenAPI spec from Django views. Additionally, we use [OpenAPITools/openapi-generator](https://github.com/OpenAPITools/openapi-generator) to generate Typescript declarations and an API Client. These generated files are checked into source control; CI checks that they are up-to-date. To regenerate these files, run

```bash
./scripts/generate_openapi.sh
```

## Committing & Formatting

To ensure commits to GitHub are safe, first install [pre-commit](https://pre-commit.com/):

```
pip install pre_commit
pre-commit install
```

Running pre-commit can confirm your commit is safe to be pushed to GitHub and correctly formatted:

```
pre-commit run --all-files
```

To automatically install precommit hooks when cloning a repo, you can run this:

```
git config --global init.templateDir ~/.git-template
pre-commit init-templatedir ~/.git-template
```

## Optional Setup

Described below are some setup steps that are not strictly necessary
for running MIT Open

### Enabling email

The app is usable without email-sending capability, but there is a lot of app functionality
that depends on it. The following variables will need to be set in your `.env` file -
please reach out to a fellow developer or devops for the correct values.

```
MAILGUN_SENDER_DOMAIN
MAILGUN_URL
MAILGUN_KEY
```

Additionally, you'll need to set `MAILGUN_RECIPIENT_OVERRIDE` to your own email address so
any emails sent from the app will be delivered to you.

### Enabling image uploads to S3

:warning: **NOTE: Article cover image thumbnails will be broken unless this is configured** :warning:

Article posts give users the option to upload a cover image, and we show a thumbnail for that
image in post listings. We use Embedly to generate that thumbnail, so they will appear as
broken images unless you configure your app to upload to S3. Steps:

1. Set `MITOPEN_USE_S3=True` in `.env`
1. Also in `.env`, set these AWS variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
   `AWS_STORAGE_BUCKET_NAME`

   These values can be copied directly from the Open Discussions CI Heroku settings, or a
   fellow dev can provide them.

### Enabling searching the course catalog on opensearch

To enable searching the course catalog on opensearch, run through these steps:

1. Start the services with `docker compose up`
2. With the above running, run this management command, which kicks off a celery task, to create an opensearch index:
   ```
   docker compose  run web python manage.py recreate_index --all
   ```
   If there is an error running the above command, observe what traceback gets logged in the celery service.
3. Once created and with `docker compose up` running, hit this endpoint in your browser to see if the index exists: `http://localhost:9101/discussions_local_all_default/_search`
4. If yes, to run a specific query, make a `POST` request (using `curl`, [Postman](https://www.getpostman.com/downloads/), Python `requests`, etc.) to the above endpoint with a `json` payload. For example, to search for all courses, run a query with Content-Type as `application/json` and with a body `{"query":{"term":{"object_type":"course"}}}`

### Running the app in a notebook

This repo includes a config for running a [Jupyter notebook](https://jupyter.org/) in a Docker container. This enables you to do in a Jupyter notebook anything you might otherwise do in a Django shell. To get started:

- Copy the example file
  ```bash
  # Choose any name for the resulting .ipynb file
  cp app.ipynb.example app.ipynb
  ```
- Build the `notebook` container _(for first time use, or when requirements change)_
  ```bash
  docker compose -f docker-compose-notebook.yml build
  ```
- Run all the standard containers (`docker compose up`)
- In another terminal window, run the `notebook` container
  ```bash
  docker compose -f docker-compose-notebook.yml run --rm --service-ports notebook
  ```
- The notebook container log output will indicate a URL at which you can interact with the notebook server.
- After visiting the notebook url, click the `.ipynb` file that you created to run the notebook
- Execute the first block to confirm it's working properly (click inside the block and press Shift+Enter)

From there, you should be able to run code snippets with a live Django app just like you would in a Django shell.

### Connecting with an OpenID Connect provider for authentication

The MIT Open application relies on an OpenID Connect client provided by Keycloak for authentication.

The following environment variables must be defined using values from a Keycloak instance:

- SOCIAL_AUTH_OL_OIDC_OIDC_ENDPOINT - The base URI for OpenID Connect discovery, https://<OIDC_ENDPOINT>/ without .well-known/openid-configuration.
- OIDC_ENDPOINT - The base URI for OpenID Connect discovery, https://<OIDC_ENDPOINT>/ without .well-known/openid-configuration.

- SOCIAL_AUTH_OL_OIDC_KEY - The client ID provided by the OpenID Connect provider.
- SOCIAL_AUTH_OL_OIDC_SECRET - The client secret provided by the OpenID Connect provider.
- AUTHORIZATION_URL - Provider endpoint where the user is asked to authenticate.
- ACCESS_TOKEN_URL - Provider endpoint where client exchanges the authorization code for tokens.
- USERINFO_URL - Provder endpoint where client sends requests for identity claims.
- KEYCLOAK_BASE_URL - The base URL of the Keycloak instance. Used for generating the
- KEYCLOAK_REALM_NAME - The Keycloak realm that the OpenID Connect client exists in.

To login via the Keycloak client, open http://od.odl.local:8063/login/ol-oidc in your browser.

Additional details can be found at https://docs.google.com/document/d/17tJ-C2EwWoSpJWZKjuhMVgsqGtyPH0IN9KakXvSKU0M/edit
