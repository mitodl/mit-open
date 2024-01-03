#!/usr/bin/env bash
set -eo pipefail

if [ -z "$(which docker)" ]; then
	echo "Error: Docker must be available in order to run this script"
	exit 1
fi

##################################################
# Generate OpenAPI Schema
##################################################
docker compose run --no-deps --rm web \
	./manage.py spectacular \
	--urlconf open_discussions.urls_spectacular \
	--file ./openapi.yaml \
	--validate

##################################################
# Generate API Client
##################################################

GENERATOR_VERSION=v7.2.0

docker run --rm -v "${PWD}:/local" -w /local openapitools/openapi-generator-cli:${GENERATOR_VERSION} \
	generate -c scripts/openapi-configs/typescript-axios.yaml

# We expect pre-commit to exit with a non-zero status since it is reformatting
# the generated code.
git ls-files frontends/api/src/generated | xargs pre-commit run --files openapi.yaml ||
	echo "OpenAPI generation complete."
