import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown'
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import { check } from './languageToolApi.js';

class Parser {
  // https://github.com/syntax-tree/mdast#nodes
  filterBlocks = [
    'code',
    'inlineCode',
  ];
  filteredData = [];

  constructor(rules) {
    this.rules = rules;
    const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
    this.filterWords = filterWordsContent.split(/\n/);
  }


isFiltered(word) {
  if (this.dictionary.includes(word)) {
    return true;
  }

  if (word.includes('   ')) {
    return true;
  }

  return false;
};

  async checkContent(content) {
    const checkResult = await check(content, rules);
    const result= checkResult.matches.map((match) => {
      const { offset, length, replacements } = match;
      const leftPart =  content.slice(0, offset);
      const lineCount = leftPart.split('\n').length;
      const word = content.slice(offset, offset + length);

      if (isFiltered(word, filterWords)) {
        return null;
      }

      const resultText = [
        formatMessage(`${fileName}#${lineCount}`, 'blue'),
        formatMessage(`${match.message} в слове "${word}" => ${match.sentence}`, 'red'),
        formatMessage('Предлагаемые варианты:', 'blue'),
        formatMessage(replacements.map((replacement) => replacement.value).join('\n--\n'), 'green'),
      ];

      return resultText.join('\n');
    });

    return result.filter((item) => item).join('\n----------------------\n');
  }

  filterContent(content) {
    const mkTree = fromMarkdown(content);
    const iter = (tree) => {
      if (this.filterBlocks.includes(tree.type)) {
        const currentNode = _.cloneDeep(tree);
        currentNode.id = uuidv4();
        this.filteredData.push(currentNode);
        if (tree.children) {
          tree.children = [];
        }
        tree.value = currentNode.id;
        return;
      }
      if (tree.children) {
        for (const child of tree.children) {
          iter(child);
        }
      }
    };

    iter(mkTree);

    return toMarkdown(mkTree);
  }

  buildContent(content) {
    const mkTree = fromMarkdown(content);
    const iter = (tree) => {
      if (this.filterBlocks.includes(tree.type)) {
        const currentNode = this.filteredData.find((node) => node.id === tree.value);
        if (currentNode.children) {
          tree.children = currentNode.children;
        }
        tree.value = currentNode.id;
        return;
      }
      if (tree.children) {
        for (const child of tree.children) {
          iter(child);
        }
      }
    };

    iter(mkTree);

    return toMarkdown(mkTree);
  }
}

export default Parser
