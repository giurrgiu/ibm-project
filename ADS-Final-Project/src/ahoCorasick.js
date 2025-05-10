"use strict";

class Node {
  constructor(pathString = "") {
    this.next = {};
    this.fail = null;
    this.output = [];
    this.pathString = pathString;
  }
}

class AhoCorasick {
  constructor(patterns) {
    this.root = new Node("");
    this.patterns = patterns;
    this._buildTrie();
    this._buildFailureLinks();
  }

  _buildTrie() {
    for (const pattern of this.patterns) {
      let current = this.root;
      for (const ch of pattern) {
        if (!current.next[ch]) {
          current.next[ch] = new Node(current.pathString + ch);
        }
        current = current.next[ch];
      }
      current.output.push(pattern);
    }
  }

  _buildFailureLinks() {
    const queue = [];
    for (const ch in this.root.next) {
      const child = this.root.next[ch];
      child.fail = this.root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const current = queue.shift();
      for (const ch in current.next) {
        const target = current.next[ch];
        let failNode = current.fail;
        while (failNode && !failNode.next[ch]) {
          failNode = failNode.fail;
        }
        target.fail = failNode ? failNode.next[ch] : this.root;
        // merge outputs
        target.output = [...target.output, ...target.fail.output];
        queue.push(target);
      }
    }
  }

  search(T) {
    const results = {};
    for (const p of this.patterns) {
      results[p] = [];
    }

    let current = this.root;
    for (let i = 0; i < T.length; i++) {
      const ch = T[i];
      while (current && !current.next[ch]) {
        current = current.fail;
      }
      if (!current) {
        current = this.root;
        continue;
      }
      current = current.next[ch];
      for (const pat of current.output) {
        const pos = i - pat.length + 2;
        results[pat].push(pos);
      }
    }
    return results;
  }

  getRoot() {
    return this.root;
  }
}

function buildTrieHierarchy(root) {
  let nodeId = 0;
  const nodeMap = new Map();

  function bfs() {
    const queue = [root];
    const rootData = {
      id: nodeId++,
      name: "root",
      children: [],
      outputs: root.output,
    };
    nodeMap.set(root, rootData);

    while (queue.length > 0) {
      const currentNode = queue.shift();
      for (const ch in currentNode.next) {
        const childNode = currentNode.next[ch];
        if (!nodeMap.has(childNode)) {
          const childData = {
            id: nodeId++,
            name: childNode.pathString,
            edgeLabel: ch,
            outputs: childNode.output,
            children: [],
          };
          nodeMap.set(childNode, childData);
          queue.push(childNode);
        }
        const parentData = nodeMap.get(currentNode);
        const childData = nodeMap.get(childNode);
        parentData.children.push(childData);
      }
    }
    return nodeMap.get(root);
  }

  const treeData = bfs();

  const failEdges = [];
  for (const [nodeObj, data] of nodeMap.entries()) {
    if (nodeObj.fail && nodeMap.has(nodeObj.fail)) {
      failEdges.push({
        sourceId: data.id,
        targetId: nodeMap.get(nodeObj.fail).id,
      });
    }
  }

  return { treeData, failEdges };
}

module.exports = { AhoCorasick, buildTrieHierarchy };
