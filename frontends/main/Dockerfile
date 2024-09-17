# Build: \
# docker build \
#   -f frontends/main/Dockerfile \
#   --build-arg NEXT_PUBLIC_ORIGIN=http://api.open.odl.local:8062 \
#   --build-arg NEXT_PUBLIC_MITOL_API_BASE_URL=http://open.odl.local:8063 \
#   --build-arg NEXT_PUBLIC_SITE_NAME="MIT Learn" \
#   --build-arg NEXT_PUBLIC_MITOL_SUPPORT_EMAIL=mitlearn-support@mit.edu \
#   --build-arg NEXT_PUBLIC_EMBEDLY_KEY= \
#   --build-arg NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS=true \
#   --build-arg NEXT_PUBLIC_CSRF_COOKIE_NAME=csrftoken-local \
#   -t mitodl/mit-learn-frontend:latest .

# Run:
# docker run -p 8062:8062 -e PORT=8062 mit-learn-frontend:latest


# Heroku build/push:
#
# heroku container:push frontend \
#   --app mitopen-rc-nextjs \
#   --recursive \
#   --arg NEXT_PUBLIC_ORIGIN=https://next.rc.learn.mit.edu \
#   --arg NEXT_PUBLIC_MITOL_API_BASE_URL=https://api.rc.learn.mit.edu \
#   --arg NEXT_PUBLIC_SITE_NAME="MIT Learn" \
#   --arg NEXT_PUBLIC_MITOL_SUPPORT_EMAIL=mitlearn-support@mit.edu \
#   --arg NEXT_PUBLIC_EMBEDLY_KEY=******** \
#   --arg NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS=true \
#   --arg NEXT_PUBLIC_CSRF_COOKIE_NAME=learn-rc-csrftoken \
#   --context-path .


FROM node:22-alpine

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY .yarnrc.yml /app
COPY .yarn/releases/yarn-4.4.1.cjs /app/.yarn/releases/yarn-4.4.1.cjs
COPY yarn.lock /app
COPY package.json /app
COPY frontends /app/frontends

RUN yarn install --immutable

WORKDIR /app/frontends/main

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

ENV NODE_ENV=production

ARG NEXT_PUBLIC_ORIGIN
ENV NEXT_PUBLIC_ORIGIN=$NEXT_PUBLIC_ORIGIN

ARG NEXT_PUBLIC_MITOL_API_BASE_URL
ENV NEXT_PUBLIC_MITOL_API_BASE_URL=$NEXT_PUBLIC_MITOL_API_BASE_URL

ARG NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME

ARG NEXT_PUBLIC_MITOL_SUPPORT_EMAIL
ENV NEXT_PUBLIC_MITOL_SUPPORT_EMAIL=$NEXT_PUBLIC_MITOL_SUPPORT_EMAIL

ARG NEXT_PUBLIC_EMBEDLY_KEY=None
ENV NEXT_PUBLIC_EMBEDLY_KEY=$NEXT_PUBLIC_EMBEDLY_KEY

ARG NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS=true
ENV NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS=$NEXT_PUBLIC_MITOL_AXIOS_WITH_CREDENTIALS

ARG NEXT_PUBLIC_CSRF_COOKIE_NAME
ENV NEXT_PUBLIC_CSRF_COOKIE_NAME=$NEXT_PUBLIC_CSRF_COOKIE_NAME


RUN echo $NEXT_PUBLIC_ORIGIN
RUN yarn build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# CMD ["node", "/app/frontends/main/.next/standalone/frontends/main/server.js"]
CMD ["yarn", "start"]
