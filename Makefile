build:
	docker build -t hexlet/languagetool-cli .

bash:
	docker run -it \
		-v .:/usr/local/bin \
		hexlet/languagetool-cli bash
