#!/usr/bin/env bash

directory="fixtures"
echo "$(docker ps)"

db_container=$(docker container ls --all | grep -w e2e-test-db | awk '{print $1}')

for path in "$directory"/*; do
	if [ -f "$path" ]; then
		file=$(basename $path)
		echo "Applying: $file"
		docker cp $path $db_container:/$file
		docker exec -u postgres $db_container psql postgres postgres -f /$file || true
	fi
done
