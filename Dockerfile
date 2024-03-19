FROM silviof/docker-languagetool

# ADD https://languagetool.org/download/ngram-data/ngrams-nl-20181229.zip /ngrams.zip
# RUN unzip ngrams

USER root

RUN curl -fsSL https://deb.nodesource.com/setup_21.x | bash -

RUN apt-get update && apt-get install -y jq nodejs

COPY . .

RUN chmod +x ./start.sh

RUN npm ci

# RUN ./start.sh

CMD [ "node ./bin/check.js" ]
