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
		hexlet/languagetool-cli \
		ltcheck.sh check

run-fix:
	docker run --rm \
		-v ./fixtures:/content \
		-v ./bin:/usr/local/bin \
		hexlet/languagetool-cli \
		ltcheck.sh fix

test:
	docker run --rm \
		-v ./fixtures:/content \
		hexlet/languagetool-cli \
		ltcheck.sh check
