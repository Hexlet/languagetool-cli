#!/usr/bin/env bash

SERVICE="java"
echo "Checking LT Server"
if pgrep -x "$SERVICE" >/dev/null; then
	echo "LT has been started. Skipping"
else
	echo "Starting LT..."
	. /LanguageTool-6.3/start.sh &
fi

# https://jqlang.github.io/jq/manual/
# https://jsonformatter.org/
# https://jsonpath.com/
# FIXME: run for every file
# TODO: join replacements
curl --data "language=ru-RU&text=кто мы? за , чток" "http://localhost:8010/v2/check" \
  | jq '.matches[] | "\(.message) -> \(.sentence) -> \(.replacements[].value)"'
