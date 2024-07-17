# languagetool-cli

Утилита для поиска различных ошибок в тексте. Работает на базе [https://languagetool.org/](https://languagetool.org/). Позволяет проверять не только орфографию, синтаксис и т.д., но и стилистику текста.

## Требования

* Docker

## Проверка ошибок

Для запуска проверки нужно выполнить команду:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/run.js check <filePath>
```

* *directory* — директория, внутри которой выполняется работа, например, может быть текущая директория *\./*. Директория связывается с директорией */content* в контейнере
* *filePath* — путь к файлам для проверки. Можно указать регулярку, например, */content/\*\*/\*.md* — проверит все файлы с расширением *.md*

Пример:

```bash
docker run --rm -v ./fixtures:/content hexlet/languagetool-cli node ./bin/run.js check /content/**/*.md
```

Справка:

```bash
docker run --rm -v ./fixtures:/content hexlet/languagetool-cli node ./bin/run.js check -h

Usage: run check [options] [dir_path]

Fix errors with overwriting files

Arguments:
  dir_path                         path to files (default: "/content")

Options:
  -r, --rules "rule1, rule2, ..."  languagetools rules
  -l, --language <Ru-ru>           A language code like en-US, de-DE, fr, or
                                   auto to guess the language automatically
                                   (default: "auto")
  -i, --ignore <file_path>         Path to file with ignore contexts (default:
                                   "/content/ignored_languagetool_errors")
  -h, --help                       display help for command
```

## Добавление ошибок в игнор

Утилита позволяет игнорить ошибки. Делается это одновременно несколькими способами:

* Во-первых, мы добавляем новые слова, которые утилита не знает, в файл *ignore_dictionary.txt*. Если вы столкнулись с какими-то ложными срабатываниями на новых словах, присылайте пуллреквест с этими словами.
* Во-вторых, утилита проверяет конфиг [плагина languagtool для VSCode](https://marketplace.visualstudio.com/items?itemName=davidlday.languagetool-linter), который обычно находится по пути *.vscode/settings.json*. Слова из него так же игнорятся, как в предыдущем способе
* Третий способ уже отличается тем, что он игнорит конкретные места с ошибками. Пример: утилита выдает ошибку на множественное использование пробелов, а эти пробелы нам нужны для стилизации таблицы. Чтобы утилита игнорила такие ошибки, достаточно создать файл *ignored_languagetool_errors* в директории, которая привязывается к */context*. В этот файл нужно скопировать вывод с ошибками (вместе с разделительными символами). Пример такого файла [можно найти в этом репо](/ignored_languagetool_errors). Так же утилита может создать сама этот файл командой
    ```bash
    docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/run.js ignore <filePath>
    ```
    То есть используется команда `ignore` вместо `check`. В остальном команда не отличается. После выполнения этой команды создастся файл *ignored_languagetool_errors*, в него будут помещены все текущие ошибки. При желании путь к файлу можно поменять с помощью опции `--ignore` (см. справку)

    Если файл будет отредактирован, добавятся или удалятся строки, то утилита может снова ругаться на такие ошибки, так как тут идет привязка к конкретному контексту.

## Сценарий работы

Обычный сценарий работы с утилитой выглядит так:

* Проверяете ошибки в тексте с помощью команды *check*
* Исправляете нужные ошибки


## Автоматическое исправление ошибок

Утилита умеет автоматически исправлять некоторые ошибки. Но делает это не всегда хорошо и только если есть варианты для замены слов. Некоторые ошибки, особенно стилистические, не предполагают таких вариантов. Утилита в таком случае не поправит ошибку. Утилита перезаписывает файлы при исправлении, поэтому этой функциональностью нужно пользоваться осторожно. Рекомендуется исправлять вручную.

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/run.js fix <filePath>
```

Пример:

```bash
docker run --rm -v ./fixtures:/content hexlet/languagetool-cli node ./bin/run.js fix /content/**/*.md
```

Справка:

```bash
docker run --rm -v ./fixtures:/content hexlet/languagetool-cli node ./bin/run.js fix -h

Usage: run fix [options] <dirPath>

Options:
  -r, --rules "rule1, rule2, ..."  languagetools rules
  -l, --language <Ru-ru>           A language code like en-US, de-DE, fr, or
                                   auto to guess the language automatically
                                   (default: "auto")
  -h, --help                       display help for command
```

## Получения списка слов с ошибками

Утилита может записать список слов, в которых нашла ошибка. Это бывает нужно, если вы хотите добавить слова в игнор. По умолчанию слова запишутся в файл *wrong_words.txt*:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/run.js words <filePath>
```

Пример:

```bash
docker run --rm -v ./fixtures:/content hexlet/languagetool-cli node ./bin/run.js words /content/**/*.md
```

Справка:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/run.js words -h

Options:
  -r, --rules "rule1, rule2, ..."  languagetools rules
  -l, --language <Ru-ru>           A language code like en-US, de-DE, fr, or
                                   auto to guess the language automatically
                                   (default: "auto")
  -f, --file <wrong_words.txt>     Destination (default: "wrong_words.txt")
  -h, --help                       display help for command

```
