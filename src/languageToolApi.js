// @ts-check

import axios from 'axios';

const baseUrl = 'http://localhost:8010';

export const check = async (content, language, rules = []) => {
  const data = new URLSearchParams({
    text: content,
    language,
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

export const addWords = (words) => {
  const url = new URL('/v2/add', baseUrl);

  const promises = words.map((word) => {
    const data = new URLSearchParams({
      word,
    });
    return axios.post(url.toString(), data);
  });

  return Promise.all(promises).then(() => console.log('Dictionary added'));
};
