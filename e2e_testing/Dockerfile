FROM  mcr.microsoft.com/playwright:v1.45.3-jammy

COPY . /tests

WORKDIR /tests

ENV CI=false
ENV BASE_URL=http://localhost:8063/

RUN yarn install

CMD ["yarn", "test"]
