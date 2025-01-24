FROM node:23.5.0-alpine3.21 AS build
ARG WORK_DIR
WORKDIR /common/app

ENV NODE_OPTIONS "--max-old-space-size=1792"
ENV NPM_CONFIG_PREFIX=/tmp/.npm-global
ENV PATH=$PATH:/tmp/.npm-global/bin
ENV HOME=/tmp


COPY ${WORK_DIR} .
RUN apk --update add git
RUN npm i && npm run build

RUN ls -la

FROM nginx:alpine
ENV WEB_DIR=/var/web

RUN ls -la 

RUN mkdir -p ${WEB_DIR}/

COPY --from=build /common/app/dist ${WEB_DIR}
RUN ls -la 
COPY --from=build /app/docker/nginx.conf /etc/nginx/conf.d/default.conf
