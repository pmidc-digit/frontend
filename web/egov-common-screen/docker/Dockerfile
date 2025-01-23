# Build stage
FROM node:23.5.0-alpine3.21 AS build

# ARG for dynamic work directory
ARG WORK_DIR
WORKDIR /app

# Set Node.js and npm configurations
ENV NODE_OPTIONS="--max-old-space-size=1792"
ENV NPM_CONFIG_PREFIX=/tmp/.npm-global
ENV PATH=$PATH:/tmp/.npm-global/bin
ENV HOME=/tmp

# Debug: Validate WORK_DIR and its contents
RUN echo "WORK_DIR is ${WORK_DIR}"
COPY ${WORK_DIR}/ .
RUN ls -la /app

# Install dependencies and build
RUN apk --update add git
RUN npm i && npm run build

# Debug: Verify the build directory
RUN ls -la 
RUN cd  kaniko
RUN tree

# Final stage
FROM nginx:alpine

# Environment variable for web directory
ENV WEB_DIR=/var/web/common

# Ensure the directory exists
RUN mkdir -p ${WEB_DIR}

# Copy the build output and nginx configuration
COPY --from=build /app/build ${WEB_DIR}
COPY --from=build /app/docker/nginx.conf /etc/nginx/conf.d/default.conf
