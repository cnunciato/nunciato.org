FROM node:alpine
MAINTAINER chris@nunciato.org
WORKDIR /web
COPY assets assets/
COPY index.html package.json Makefile ./
RUN npm install
EXPOSE 4000
CMD ["npm", "start"]
