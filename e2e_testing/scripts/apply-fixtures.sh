#!/usr/bin/env bash

docker compose -f docker-compose-e2e-tests.yml cp e2e_testing/fixtures web:/src/e2e_testing
docker compose -f docker-compose-e2e-tests.yml exec web python3 manage.py loaddata e2e_testing/fixtures/*.json
