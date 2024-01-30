FROM  mcr.microsoft.com/playwright:v1.41.1-jammy

ENV CI=false

COPY . /tests

WORKDIR /tests

RUN yarn install

CMD ["yarn", "test"]
