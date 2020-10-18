FROM node:14.14.0

ARG npm_package_name
ARG npm_package_version
ENV VAULT_REGISTRIES=/vault/vault_registries

WORKDIR /vault

RUN npm i --production ${npm_package_name}@${npm_package_version}

EXPOSE 4874
VOLUME [ "/vault/vault_registries" ]

CMD npx vault server
