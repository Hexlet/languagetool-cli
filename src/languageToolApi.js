// @ts-check

import axios from 'axios';

const baseUrl = 'http://localhost:8010';

export const check = async (content, rules = []) => {
  const data = new URLSearchParams({
    text: content,
    language: 'ru-RU',
    enabledOnly: rules.length > 0,
    enabledRules: rules.join(','),
  });

  const url = new URL('/v2/check', baseUrl);
  const response = await axios.post(url.toString(), data, { 
    headers: {
      Accept: 'application/json',
    },
  });

  return response.data;
};

const addWords = (words) => {
  // const content = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  // const words = content.split(/\s/);

  const url = new URL('/v2/add', baseUrl);

  const promises = words.map((word) => {
    const data = new URLSearchParams({
      word,
    });
    return axios.post(url.toString(), data);
  });

  return Promise.all(promises).then(() => console.log('Dictionary added'));
};
