# languagetool-cli

For checking errors:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli node ./bin/check.js
```

For fixing errors:

```bash
docker run --rm -v ./<directory>:/content hexlet/languagetool-cli ltcheck.sh fix
```
