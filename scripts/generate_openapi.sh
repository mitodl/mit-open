# #!/usr/bin/env bash

if [ -z "$(which docker)" ]
then
    echo "Error: Docker must be available in order to run this script"
    exit 1
fi

SCRIPT_DIR=$(dirname "$0")

cd $SCRIPT_DIR/../

echo "pwd is $PWD"

##################################################
# Generate OpenAPI Schema
##################################################
docker compose run --rm web \
    ./manage.py spectacular \
    --urlconf open_discussions.urls_spectacular \
    --file ./openapi.yaml \
    --validate

##################################################
# Generate API Client
##################################################
cd ./frontends/api
cp ../../openapi.yaml ./openapi.yaml

GENERATOR_VERSION=v6.6.0
docker run --rm -v ".:/local" openapitools/openapi-generator-cli:${GENERATOR_VERSION} generate \
    -i /local/openapi.yaml \
    -g typescript-axios \
    -o /local/src/generated

rm ./openapi.yaml

docker compose run --rm watch yarn workspace @mit-open/api global:fmt-fix