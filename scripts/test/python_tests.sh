#!/usr/bin/env bash
set -eo pipefail

echohighlight() {
	# shellcheck disable=SC2145
	echo -e "\x1b[32;1m$@\x1b[0m"
}

function run_test {
	# shellcheck disable=SC2145
	echohighlight "[TEST SUITE] $@"
	poetry run "$@"
}

# Placeholder build for use in django tests.
mkdir ./frontends/mit-learn/build
touch ./frontends/mit-learn/build/index.html

run_test ./scripts/test/detect_missing_migrations.sh
run_test ./scripts/test/no_auto_migrations.sh
run_test ./scripts/test/openapi_spec_check.sh

# run tests in parallel - one proc per logical cpu
run_test pytest -n logical

# shellcheck disable=SC2154
exit $status
