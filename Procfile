release: bash scripts/heroku-release-phase.sh
web: bin/start-nginx bin/start-pgbouncer uwsgi uwsgi.ini
worker: bin/start-pgbouncer celery -A main.celery:app worker -E -Q default --concurrency=2 -B -l $MITOL_LOG_LEVEL
extra_worker_2x: bin/start-pgbouncer celery -A main.celery:app worker -E -Q edx_content,default --concurrency=2 -l $MITOL_LOG_LEVEL
extra_worker_performance: bin/start-pgbouncer celery -A main.celery:app worker -E -Q edx_content,default -l $MITOL_LOG_LEVEL
