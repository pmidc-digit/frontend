FROM egovio/alpine-node-builder-10:yarn AS build  
ARG WORK_DIR
WORKDIR /app
ENV NODE_OPTIONS "--max-old-space-size=4000"

# Copy the project files
COPY ${WORK_DIR} .

# Clean yarn cache and install dependencies
RUN yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile
RUN yarn cache clean
RUN yarn add emojis-list
RUN yarn install --update-checksums --frozen-lockfile

# Build the project
RUN yarn run prod:employee

# Create runtime image
FROM nginx:mainline-alpine 
ENV WEB_DIR=/var/web/employee

RUN mkdir -p ${WEB_DIR}

# Copy build files and nginx configuration
COPY --from=build /app/packages/employee/build ${WEB_DIR}/
COPY --from=build /app/docker/employee/nginx.conf /etc/nginx/conf.d/default.conf
