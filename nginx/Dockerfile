# NOTE: this dockerfile is primarilty for local development only
#       it's primary purpose is to emulate heroku-buildpack-nginx's
#       functionality that compiles config/nginx.conf.erb
# See https://github.com/heroku/heroku-buildpack-nginx/blob/fefac6c569f28182b3459cb8e34b8ccafc403fde/bin/start-nginx
FROM nginx:1.27.0

# Logs are configured to a relatic path under /etc/nginx
# but the container expects /var/log
RUN mkdir -p /etc/nginx/logs && ln -sf /var/log/nginx /etc/nginx/logs/

# erb unfortunately needs a whole ruby install
RUN apt-get update && apt-get install -y ruby

# this gets run automatically by the nginx container's entrypoint
COPY 20-compile-nginx-conf-erb.sh /docker-entrypoint.d

# NOTE: this removes the args "-g daemon off" because nginx is impolite
#       and treats a cli flag and a config flag as duplicate:
#
#       nginx: [emerg] "daemon" directive is duplicate in /etc/nginx/nginx.conf:3
#
CMD ["nginx"]
