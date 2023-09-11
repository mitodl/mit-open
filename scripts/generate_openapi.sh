#!/usr/bin/env bash

if [ -z "$(which docker)" ]; then
	echo "Error: Docker must be available in order to run this script"
	exit 1
fi

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

GENERATOR_VERSION=v6.6.0

docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:${GENERATOR_VERSION} \
	generate \
	-i /local/openapi.yaml \
	-g typescript-axios \
	-o /local/frontends/api/src/generated \
	--ignore-file-override /local/frontends/api/.openapi-generator-ignore \
	--additional-properties=useSingleRequestParameter=true,paramNaming=original

docker compose run --rm watch yarn prettier --write frontends/api/src/generated
