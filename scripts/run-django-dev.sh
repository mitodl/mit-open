#!/usr/bin/env bash
#
# This script runs the django app

python3 manage.py collectstatic --noinput --clear
python3 manage.py migrate --noinput
RUN_DATA_MIGRATIONS=true python3 manage.py migrate --noinput

# load required fixtures on development by default
python3 manage.py loaddata platforms schools departments offered_by

uwsgi uwsgi.ini --honour-stdin
