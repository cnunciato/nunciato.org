install:
	npm install

build:
	tar -zcvf nunciato.org.tar.gz --exclude=nunciato.org.tar.gz .

test:
	npm test

start:
	npm start
