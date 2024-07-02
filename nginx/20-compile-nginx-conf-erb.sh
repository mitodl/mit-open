#!/bin/sh
# Based on https://github.com/nginxinc/docker-nginx/blob/6f0396c1e06837672698bc97865ffcea9dc841d5/mainline/debian/20-envsubst-on-templates.sh

set -e

ME=$(basename $0)

auto_erb_build() {
	template="/etc/nginx/templates/nginx.conf.erb"
	output_path="/etc/nginx/nginx.conf"

	echo "$ME: Running erb on $template to $output_path"
	erb "$template" >"$output_path"
}

auto_erb_build

exit 0
