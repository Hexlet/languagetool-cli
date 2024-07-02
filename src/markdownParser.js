import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown'
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import fs from 'fs';

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
