# MIT Open
This application provides a central interface from which learners can browse MIT courses.

**SECTIONS**
1. [Setup and Running the app](#initial-setup)
1. [Running and Accessing the App](#running-and-accessing-the-app)
1. [Testing and Formatting](#testing-and-formatting)
1. [Optional Setup](#optional-setup)


# Initial Setup

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


### Load initial data

Run the following to load platforms, departments, and offererors into the database:

```bash
docker compose run --rm web python manage.py loaddata platforms departments offered_by
```


# Testing, Formatting, & Code Generation

[The commands outlined in the common OL web app guide](https://github.com/mitodl/handbook/blob/master/common-web-app-guide.md#testing-and-formatting)
are all relevant to MIT Open.

The following commands are also available:

```
# Format python code
docker-compose run --rm web black .
# Run storybook locally
docker-compose run -p 9001:9001 watch npm run storybook
```

## Code Generation
MIT Open uses [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/) to generate and OpenAPI spec from Django views. Additionally, we use [OpenAPITools/openapi-generator](https://github.com/OpenAPITools/openapi-generator) to generate Typescript declarations and an API Client. These generated files are checked into source control; CI checks that they are up-to-date. To regenerate these files, run
```bash
./scripts/generate_openapi.sh
```

# Optional Setup

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

### Enabling article posts
It is based on text posts but allows the user to add a cover image, provides richer editing capabilities, etc.
To enable it, run through these steps:

1. Adjust channel settings to allow article posts. This can be done in one of two ways:
    1. Visit the channel settings page in the running app when logged in as a moderator user.
        Select the article checkbox under "Allowed Post Types" and save. 
        (There should be an option in the channel page header to visit the settings page, or
        you can navigate there directly: `/c/<channel_name>/settings/`).
    1. Update the channel directly in a Django shell:
        
        ```python
        from channels.models import Channel
        # To allow all post types for the channel...
        Channel.objects.filter(name="SOME_CHANNEL_NAME").update(
           allowed_post_types=Channel.allowed_post_types.link | Channel.allowed_post_types.self | Channel.allowed_post_types.article
        )        
        ```
1. Set up environment variables for the article UI. In `.env`, add:
    ```python
    FEATURE_ARTICLE_UI=True
    # Ask a fellow developer for the following values...
    CKEDITOR_ENVIRONMENT_ID=...
    CKEDITOR_SECRET_KEY=...
    CKEDITOR_UPLOAD_URL=...
    ```

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
    
### Enabling widgets

To enable channel widgets, run through these steps:

1. Run the management command to ensure that your channels are properly configured
    ```bash
    docker-compose run --rm web ./manage.py backpopulate_channel_widget_lists
    ```
1. Add `FEATURE_WIDGETS_UI=True` to your `.env`

### Enabling searching the course catalog on opensearch

To enable searching the course catalog on opensearch, run through these steps:
1. Start the services with `docker-compose up`
2. With the above running, run this management command, which kicks off a celery task, to create an opensearch index:
    ```
    docker-compose  run web python manage.py recreate_index --all
    ```
    If there is an error running the above command, observe what traceback gets logged in the celery service.
3. Once created and with `docker-compose up`  running, hit this endpoint in your browser to see if the index exists: `http://localhost:9101/discussions_local_all_default/_search`
4. If yes, to run a specific query, make a `POST` request (using `curl`, [Postman](https://www.getpostman.com/downloads/), Python `requests`, etc.) to the above endpoint with a `json` payload. For example, to search for all courses, run a query with Content-Type as `application/json` and with a body `{"query":{"term":{"object_type":"course"}}}`

### Running the app in a notebook

This repo includes a config for running a [Jupyter notebook](https://jupyter.org/) in a
Docker container. This enables you to do in a Jupyter notebook anything you might 
otherwise do in a Django shell. To get started:

- Copy the example file
    ```bash
    # Choose any name for the resulting .ipynb file
    cp app.ipynb.example app.ipynb
    ```
- Build the `notebook` container _(for first time use, or when requirements change)_
    ```bash
    docker-compose -f docker-compose-notebook.yml build
    ```
- Run all the standard containers (`docker-compose up`)
- In another terminal window, run the `notebook` container
    ```bash
    docker-compose -f docker-compose-notebook.yml run --rm --service-ports notebook
    ```
- Visit the running notebook server in your browser. The `notebook` container log output will
  indicate the URL and `token` param with some output that looks like this:
    ```
    notebook_1  |     To access the notebook, open this file in a browser:
    notebook_1  |         file:///home/mitodl/.local/share/jupyter/runtime/nbserver-8-open.html
    notebook_1  |     Or copy and paste one of these URLs:
    notebook_1  |         http://(2c19429d04d0 or 127.0.0.1):8080/?token=2566e5cbcd723e47bdb1b058398d6bb9fbf7a31397e752ea
    ```
  Here is a one-line command that will produce a browser-ready URL from that output. Run this in a separate terminal:
    ```bash
    APP_HOST="open.ol.local"; docker logs $(docker ps --format '{{.Names}}' | grep "_notebook_run_") | grep -E "http://(.*):8080[^ ]+\w" | tail -1 | sed -e 's/^[[:space:]]*//' | sed -e "s/(.*)/$APP_HOST/"
    ```
  OSX users can pipe that output to `xargs open` to open a browser window directly with the URL from that command.
- Click the `.ipynb` file that you created to run the notebook
- Execute the first block to confirm it's working properly (click inside the block
  and press Shift+Enter)
  
From there, you should be able to run code snippets with a live Django app just like you 
would in a Django shell.

### Connecting with an OpenID Connect provider for authentication
The MIT Open application can be configured to utilize an OpenID Connect provider for authentication.  


The following environment variables must be defined:
    * SOCIAL_AUTH_OL_OIDC_OIDC_ENDPOINT - The base URI for OpenID Connect discovery, https://<OIDC_ENDPOINT>/ without .well-known/openid-configuration.
    * OIDC_ENDPOINT
    * SOCIAL_AUTH_OL_OIDC_KEY - The client ID provided by the OpenID Connect provider.
    * SOCIAL_AUTH_OL_OIDC_SECRET - The client secret provided by the OpenID Connect provider.
    * AUTHORIZATION_URL - Provider endpoint where the user is asked to authenticate.
    * ACCESS_TOKEN_URL - Provider endpoint where client exchanges the authorization code for tokens.
    * USERINFO_URL - Provder endpoint where client sends requests for identity claims.

To authenticate with an existing MIT Open user via an OpenID Connect provider, open http://od.odl.local:8063/login/ol-oidc in your browser.


## Commits

To ensure commits to github are safe, you should install the following first:
```
pip install pre_commit
pre-commit install
```

To automatically install precommit hooks when cloning a repo, you can run this:
```
git config --global init.templateDir ~/.git-template
pre-commit init-templatedir ~/.git-template
```    
