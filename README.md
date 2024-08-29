# languagetool-cli

## Checking errors

```bash
docker run --rm -v ./<directory>:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js check <filePath>
```

Example:

```bash
docker run --rm -v ./fixtures:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js check /content/**/*.md
```

Help:

```bash
docker run --rm -v ./fixtures:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js check -h

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

## Fixing errors:

```bash
docker run --rm -v ./<directory>:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js fix <filePath>
```

Example:

```bash
docker run --rm -v ./fixtures:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js fix /content/**/*.md
```

Help:

```bash
docker run --rm -v ./fixtures:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js fix -h

Usage: run fix [options] <dirPath>

Options:
  -r, --rules "rule1, rule2, ..."  languagetools rules
  -l, --language <Ru-ru>           A language code like en-US, de-DE, fr, or
                                   auto to guess the language automatically
                                   (default: "auto")
  -h, --help                       display help for command
```

## To get wrong words:

```bash
docker run --rm -v ./<directory>:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js words <filePath>
```

Example:

```bash
docker run --rm -v ./fixtures:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js words /content/**/*.md
```

```bash
docker run --rm -v ./<directory>:/content ghcr.io/hexlet/languagetool-cli node ./bin/run.js words -h

Options:
  -r, --rules "rule1, rule2, ..."  languagetools rules
  -l, --language <Ru-ru>           A language code like en-US, de-DE, fr, or
                                   auto to guess the language automatically
                                   (default: "auto")
  -f, --file <wrong_words.txt>     Destination (default: "wrong_words.txt")
  -h, --help                       display help for command

```
