#!/usr/bin/env bash
set -eo pipefail

if [ -z "$(which docker)" ]; then
	echo "Error: Docker must be available in order to run this script"
	exit 1
fi

SPEC_DIR="./openapi/specs/"
SPEC_FILE="./openapi/specs/v1.yaml"

##################################################
# Generate OpenAPI Schema
##################################################
docker compose run --no-deps --rm web \
	./manage.py spectacular \
	--urlconf open_discussions.urls \
	--file ${SPEC_FILE} \
	--validate \
	--api-version 'v1'

##################################################
# Generate API Client
##################################################

GENERATOR_VERSION=v7.2.0

docker run --rm -v "${PWD}:/local" -w /local openapitools/openapi-generator-cli:${GENERATOR_VERSION} \
	generate -c scripts/openapi-configs/typescript-axios.yaml

# We expect pre-commit to exit with a non-zero status since it is reformatting
# the generated code.
git ls-files frontends/api/src/generated | xargs pre-commit run --files ${SPEC_DIR}/* ||
	echo "OpenAPI generation complete."
