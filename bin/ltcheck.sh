#!/usr/bin/env bash

disalbed_catagories="STYLE"
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

fix() {
  local text=$1
  local filepath=$2
  local current_diff_length=0
  local result=${text}

  body=$(curl -s -G --data-urlencode "language=ru-RU" --data-urlencode "text=$text" --data-urlencode "disabledCategories=$disalbed_catagories" "http://localhost:8010/v2/check")
  while read i; do
    if [[ -z "$i" ]]; then
      continue
    fi

    offset=$(echo "$i" | jq -c '.offset')
    length=$(echo "$i" | jq -c '.length')
    correct=$(echo "$i" | jq -c '.replacements[0].value')
    sentence=$(echo "$i" | jq -c '.sentence')
    correct_length=${#correct}
    diff_length=$(($correct_length - $length))

    left_part=${result:0:$(($offset + $current_diff_length))}
    right_part=${result:$(($offset + $length + $current_diff_length))}
    result="${left_part}${correct}${right_part}"
    current_diff_length=$(($current_diff_length + $diff_length))
  done <<<$(echo "$body" | jq -c '.matches[]')

  echo -e "Было:\n${text}\n"

  echo -e "Стало:\n${result}\n"
  
  cat <<< "$result" > "$filepath"
}

if [[ "$@" == "fix" ]]; then
  echo "Start fixing =>"

  find /content -type f -name "*.md" | while read -r filepath; do
    echo -e "\n$filepath"
    file_content=$(cat "$filepath")
    fix "$file_content" "$filepath"
    echo -e "\n$filepath Fixing done\n-------"
  done

else

  echo "Start checking =>"

  find /content -type f -name "*.md" | while read -r filepath; do
    echo -e "\n$filepath"
    file_content=$(cat "$filepath")
	  check "$file_content"
    echo -e "\n$filepath Checking done\n-------"
  done

fi
