#!/usr/bin/env bash
#
# This script runs the django app

python3 manage.py collectstatic --noinput --clear

# run initial django migrations
python3 manage.py migrate --noinput

# populate cache table
python3 manage.py createcachetable

# run ONLY data migrations
RUN_DATA_MIGRATIONS=true python3 manage.py migrate --noinput

# load required fixtures on development by default
echo "Loading fixtures!"
python3 manage.py loaddata platforms schools departments offered_by

# consolidate user subscriptions and remove duplicate percolate instances
python $MANAGE_FILE prune_subscription_queries 2>&1 | indent

uwsgi uwsgi.ini --honour-stdin
