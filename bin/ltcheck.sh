#!/usr/bin/env bash

set -e

SERVICE="java"
echo "Checking LT Server"
if pgrep -x "$SERVICE" >/dev/null; then
	echo "LT has been started. Skipping"
else
	echo "Starting LT..."
	. /LanguageTool-6.3/start.sh > /dev/null 2>&1 &
fi

# https://jqlang.github.io/jq/manual/
# https://jsonformatter.org/
# https://jsonpath.com/
# FIXME: run for every file
# TODO: join replacements
# curl --data "language=ru-RU&text=кто мы? за , чток" "http://localhost:8010/v2/check" |
# 	jq '.matches[] | "\(.message) -> \(.sentence) -> \(.replacements[].value)"'

check() {
	local text=$1

	result=$(curl -s --data "language=ru-RU&text=$text" "http://localhost:8010/v2/check" |
		jq '.matches[] | "\(.message) => \(.sentence)"')

	echo "$result"
}

echo "Start checking =>"

find /content -type f -name "*.md" | while read -r filepath; do
	echo -e "\n$filepath"
	file_content=$(cat "$filepath")
	check "$file_content"
done
