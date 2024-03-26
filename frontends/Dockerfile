FROM node:20.11-alpine
LABEL maintainer "ODL DevOps <mitx-devops@mit.edu>"

# RUN apt-get update && apt-get install libelf1

# USER node

COPY . /src

WORKDIR /src

# Workaround for ownership issues on /src
# Your user in the host system owns this directory anda corresponding user
# with the same uid doesn't exist in the container. This makes git unhappy,
# which also makes commands like `yarn run test-watch` unhappy.
# RUN git config --global --add safe.directory /src

RUN yarn set version 3.7.0
RUN yarn install

# Rebuilds for the case that the lockfile contains platform-specific dependencies
# RUN yarn rebuild
# RUN yarn add -D @swc/core
# RUN yarn build

CMD ["yarn", "watch"]
