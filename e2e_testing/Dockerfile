FROM  mcr.microsoft.com/playwright:v1.41.1-jammy

# Add Docker's official GPG key:
RUN apt-get update &&\
  apt-get install ca-certificates curl &&\
  install -m 0755 -d /etc/apt/keyrings &&\
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc &&\
  chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null &&\
  apt-get update

# Install Docker
RUN apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

COPY . /tests

WORKDIR /tests

ENV CI=false
ENV BASE_URL=http://localhost:8063/

RUN yarn install

CMD ["yarn", "test"]
