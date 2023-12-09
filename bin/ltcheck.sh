#!/usr/bin/env bash

set -e

SERVICE="java"
if pgrep -x "$SERVICE" >/dev/null; then
	echo "LT has been started. Skipping"
else
	echo "Starting LT..."
	. /LanguageTool-6.3/start.sh >/dev/null 2>&1 &
	sleep 2
fi

# https://jqlang.github.io/jq/manual/
# https://jsonformatter.org/
# https://jsonpath.com/
# FIXME: run for every file
# TODO: join replacements
# curl --data "language=ru-RU&text=кто мы? за , чток" "http://localhost:8010/v2/check" |
# 	jq '.matches[] | "\(.message) -> \(.sentence) -> \(.replacements[].value)"'

echo_green() {
    echo -e "\e[32m$1\e[0m"
}

check() {
	local text=$1

  body=$(curl -s -G --data-urlencode "language=ru-RU" --data-urlencode "text=$text" "http://localhost:8010/v2/check")
	result=$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')

  if [ -n "$result" ]; then
    echo "$result"
  else
    echo_green "No mistakes!"
  fi
}

echo "Start checking =>"

find /content -type f -name "*.md" | while read -r filepath; do
	echo -e "\n$filepath"
	file_content=$(cat "$filepath")
	check "$file_content"
done
