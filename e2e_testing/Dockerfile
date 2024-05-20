FROM  mcr.microsoft.com/playwright:v1.44.0-jammy

COPY . /tests

WORKDIR /tests

ENV CI=false
ENV BASE_URL=http://localhost:8063/

RUN yarn install

CMD ["yarn", "test"]
