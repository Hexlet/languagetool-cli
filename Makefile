build:
	docker build -t hexlet/languagetool-cli .

bash:
	docker run --rm -it \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli bash

check:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js check /content/**/*.md

run-fix:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js fix /content/**/*.md

run-ignore:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js ignore /content/**/*.md

test:
	docker run --rm \
		-v ./fixtures:/content \
		hexlet/languagetool-cli

getWords:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js words /content/**/*.md -f /content/wrong_words.txt

help-check:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js check -h

help-fix:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js fix -h

help-words:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/LanguageTool-6.4/bin \
		-v ./src:/LanguageTool-6.4/src \
		hexlet/languagetool-cli \
		node ./bin/run.js words -h
