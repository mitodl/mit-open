release: bash scripts/heroku-release-phase.sh
web: bin/start-nginx bin/start-pgbouncer newrelic-admin run-program uwsgi uwsgi.ini
worker: bin/start-pgbouncer newrelic-admin run-program celery -A main.celery:app worker -Q default --concurrency=2 -B -l $MITOPEN_LOG_LEVEL
extra_worker_2x: bin/start-pgbouncer newrelic-admin run-program celery -A main.celery:app worker -Q edx_content,default --concurrency=2 -l $MITOPEN_LOG_LEVEL
extra_worker_performance: bin/start-pgbouncer newrelic-admin run-program celery -A main.celery:app worker -Q edx_content,default -l $MITOPEN_LOG_LEVEL
