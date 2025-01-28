FROM node:23.5.0-alpine3.21 AS build
ARG WORK_DIR
WORKDIR /app
ENV NODE_OPTIONS "--max-old-space-size=1792"
ENV NPM_CONFIG_PREFIX=/tmp/.npm-global
ENV PATH=$PATH:/tmp/.npm-global/bin
ENV HOME=/tmp

# copy the project files
COPY ${WORK_DIR} .
RUN npm i && npm run build

# Create runtime image
FROM nginx:mainline-alpine
ENV WEB_DIR=/var/web/common-screen

RUN mkdir -p ${WEB_DIR}

COPY --from=build /app/dist ${WEB_DIR}/
COPY --from=build /app/docker/nginx.conf /etc/nginx/conf.d/default.conf