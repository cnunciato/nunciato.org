build:
	npm install
	npm test
	touch nunciato.org.tar.gz
	tar -zcvf nunciato.org.tar.gz --exclude=nunciato.org.tar.gz .
	echo "This is super-awesome."
