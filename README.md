# languagetool-cli

For checking errors:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/check.js firstRule secondRule
```

For fixing errors:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/fix.js firstRule secondRule
```

To get wrong words:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/getWords.js firstRule secondRule
```
