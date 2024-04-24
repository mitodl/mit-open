#!/usr/bin/env bash
#
# This script runs the django app

python3 manage.py collectstatic --noinput --clear
python3 manage.py migrate --noinput

if [[ $NODE_ENV == "development" ]]; then
	# load required fixtures on development by default
	python3 manage.py loaddata platforms schools departments offered_by
fi

uwsgi uwsgi.ini --honour-stdin
