FROM node:alpine
MAINTAINER chris@nunciato.org

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /web
COPY assets assets/
COPY index.html package.json CNAME Makefile ./
RUN npm install
EXPOSE 4000
CMD ["npm", "start"]
