#!/usr/bin/env bash
TMPFILE=$(mktemp)

./manage.py spectacular \
	--urlconf=open_discussions.urls_spectacular \
	--file $TMPFILE

diff $TMPFILE ./openapi.yaml

if [ $? -eq 0 ]; then
	echo "OpenAPI spec is up to date!"
	exit 0
else
	echo "OpenAPI spec is out of date. Please regenerate via ./scripts/generate_openapi.sh"
	exit 1
fi
