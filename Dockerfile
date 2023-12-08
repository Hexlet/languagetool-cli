FROM silviof/docker-languagetool

# ADD https://languagetool.org/download/ngram-data/ngrams-nl-20181229.zip /ngrams.zip
# RUN unzip ngrams

USER root

RUN apt-get update && apt-get install -y jq
