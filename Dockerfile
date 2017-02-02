FROM node
MAINTAINER chris@nunciato.org
WORKDIR /web
COPY assets assets/
COPY index.html package.json Makefile ./
RUN make install
EXPOSE 4000
CMD ["make", "start"]
