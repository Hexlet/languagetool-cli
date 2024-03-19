import axios from 'axios';
import fs from 'fs';
import path from 'path';

const baseUrl = 'http://localhost:8010';
const extensions = ['.md', '.adoc'];

const check = () => {
  const dirpath = '/content';
  fs.readdir(dirpath, { recursive: true }, (_err, fileNames) => {

    const filePaths = fileNames.filter((filename) => extensions.includes(path.extname(filename).toLowerCase()));

    const promises = filePaths.map(async (filepath) => {
      const fullpath = path.join(dirpath, filepath);
      const content = fs.readFileSync(fullpath);

      const data = new URLSearchParams({
        text: content,
        language: 'ru-RU',
        enabledOnly: 'false',
      });

      const url = new URL('/v2/check', baseUrl);
      const response = await axios.post(url.toString(), data, { 
        headers: {
          Accept: 'application/json',
        },
      });

      const result= response.data.matches.map((match) => `${match.message} => ${match.sentence}`); //$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')
      
      console.log(`\n${fullpath}`);
      console.log(result.join('\n----\n'));
      console.log(`-------------------${fullpath} done -----------------`);
    });

    Promise.all(promises).then(() => {
      console.log('------------------DONE-----------------');
    });
  });
};

const fix = () => {};

export {
  check,
};
