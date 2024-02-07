#!/usr/bin/env bash

directory="e2e_testing/fixtures"

for path in "$directory"/*; do
	if [ -f "$path" ]; then
		file=$(basename $path)
		echo "Applying: $file"
		docker compose -f docker-compose-e2e-tests.yml cp $path db:/$file
		docker compose -f docker-compose-e2e-tests.yml exec -u postgres db psql postgres postgres -f /$file
	fi
done
