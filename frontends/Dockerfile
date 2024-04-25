FROM node:20.12-alpine
LABEL maintainer "ODL DevOps <mitx-devops@mit.edu>"

COPY . /src

WORKDIR /src

RUN yarn set version 4.1.1
RUN yarn install --immutable

# Rebuilds for the case that the lockfile contains platform-specific dependencies
RUN yarn rebuild

RUN yarn build-storybook

CMD ["yarn", "watch:docker"]
