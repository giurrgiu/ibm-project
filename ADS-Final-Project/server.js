"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { AhoCorasick, buildTrieHierarchy } = require("./src/ahoCorasick");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "web")));

app.post("/api/search", (req, res) => {
  const { text, patterns } = req.body;
  if (!text || !patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return res
      .status(400)
      .json({ error: "Please provide 'text' and an array 'patterns'." });
  }

  const aho = new AhoCorasick(patterns);

  const results = aho.search(text);

  const { treeData, failEdges } = buildTrieHierarchy(aho.getRoot());

  res.json({ results, treeData, failEdges });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
