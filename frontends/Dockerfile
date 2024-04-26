FROM node:20.12-alpine
LABEL maintainer "ODL DevOps <mitx-devops@mit.edu>"

COPY ./package.json /src/package.json
COPY ./yarn.lock /src/yarn.lock
COPY ./.yarn /src/.yarn
COPY ./frontends /src/frontends

WORKDIR /src

RUN yarn set version 4.1.1
RUN yarn install

# Rebuilds for the case that the lockfile contains platform-specific dependencies
RUN yarn rebuild

WORKDIR /src/frontends

RUN yarn build-storybook

CMD ["yarn", "watch:docker"]
