build:
	docker build -t hexlet/languagetool-cli .

bash:
	docker run --rm -it \
		-v ./fixtures:/content \
		-v ./bin:/usr/local/bin \
		hexlet/languagetool-cli bash

run:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/usr/local/bin \
		-v ./src:/LanguageTool-6.3/src \
		hexlet/languagetool-cli \
		node ./bin/check.js

run-fix:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/usr/local/bin \
		hexlet/languagetool-cli \
		node ./bin/fix.js

test:
	docker run --rm \
		-v ./fixtures:/content \
		hexlet/languagetool-cli

getWords:
	docker run --rm \
		-v ./fixtures:/content \
		hexlet/languagetool-cli
		node ./bin/getWords.js
