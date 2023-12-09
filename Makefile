build:
	docker build -t hexlet/languagetool-cli .

bash:
	docker run --rm -it \
		-v ./fixtures:/content \
		-v ./bin:/usr/local/bin \
		hexlet/languagetool-cli bash
