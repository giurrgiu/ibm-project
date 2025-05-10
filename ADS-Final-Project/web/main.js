document.addEventListener("DOMContentLoaded", () => {
  const patternsInput = document.getElementById("patternsInput");
  const textInput = document.getElementById("textInput");
  const buildBtn = document.getElementById("buildBtn");
  const resultsDiv = document.getElementById("results");
  const legendDiv = document.getElementById("legend");

  const colorPalette = [
    "#f94144",
    "#f3722c",
    "#f8961e",
    "#f9c74f",
    "#90be6d",
    "#43aa8b",
    "#577590",
    "#277da1",
    "#d45087",
    "#e63946",
    "#ffa600",
    "#bc5090",
  ];

  buildBtn.addEventListener("click", async () => {
    const rawPatterns = patternsInput.value.trim();
    const text = textInput.value || "";
    if (!rawPatterns) {
      alert("Please enter some patterns.");
      return;
    }

    const patterns = rawPatterns
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    try {
      const resp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, patterns }),
      });
      if (!resp.ok) {
        throw new Error("Server error");
      }
      const { results, treeData, failEdges } = await resp.json();

      const patternColors = assignPatternColors(patterns);

      renderLegend(patternColors);

      const highlighted = highlightText(text, results, patternColors);
      resultsDiv.innerHTML = `<strong>Highlighted Text:</strong>\n${highlighted}`;

      renderAutomaton(treeData, failEdges);
    } catch (err) {
      console.error(err);
      alert("Error building automaton: " + err.message);
    }
  });

  function assignPatternColors(patterns) {
    const map = {};
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      map[p] = colorPalette[i % colorPalette.length];
    }
    return map;
  }

  function renderLegend(patternColors) {
    legendDiv.innerHTML = "<strong>Pattern Colors:</strong><br/>";
    for (const [pattern, color] of Object.entries(patternColors)) {
      legendDiv.innerHTML += `
          <div class="legend-item">
            <span class="color-box" style="background-color:${color}"></span>
            ${pattern}
          </div>
        `;
    }
  }

  function highlightText(text, results, patternColors) {
    const matches = [];
    for (const pat of Object.keys(results)) {
      const positions = results[pat];
      for (const pos of positions) {
        const start = pos - 1;
        const end = start + pat.length;
        matches.push({ start, end, pat });
      }
    }
    matches.sort((a, b) => a.start - b.start);

    let highlighted = "";
    let currentIndex = 0;
    for (const m of matches) {
      if (m.start > currentIndex) {
        highlighted += text.substring(currentIndex, m.start);
      }

      const color = patternColors[m.pat] || "#ffff00";
      const matchedText = text.substring(m.start, m.end);
      highlighted += `<span style="background-color:${color}">${matchedText}</span>`;
      currentIndex = m.end;
    }

    if (currentIndex < text.length) {
      highlighted += text.substring(currentIndex);
    }

    return highlighted;
  }

  function renderAutomaton(treeData, failEdges) {
    const svg = d3.select("#chart");
    svg.selectAll("*").remove();

    const container = document.getElementById("chartContainer");
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g").attr("class", "main-group");

    const root = d3.hierarchy(treeData, (d) => d.children);

    const layout = d3
      .tree()
      .nodeSize([50, 200])
      .separation((a, b) => (a.parent === b.parent ? 2 : 2));

    layout(root);

    const linkGroup = g
      .selectAll(".link-group")
      .data(root.links())
      .enter()
      .append("g")
      .attr("class", "link-group");

    linkGroup
      .append("path")
      .attr("class", "link")
      .attr("d", (d) => diagonal(d.source, d.target));

    linkGroup
      .append("text")
      .attr("class", "link-label")
      .text((d) => d.target.data.edgeLabel || "")
      .attr("dy", -5)
      .attr("transform", (d) => {
        const { x, y } = midpoint(d.source, d.target);
        return `translate(${y},${x})`;
      });

    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node.append("circle").attr("r", 10);

    node
      .append("text")
      .attr("dx", 15)
      .attr("dy", "0.32em")
      .text((d) => d.data.name);

    const idToNode = {};
    root.descendants().forEach((n) => {
      idToNode[n.data.id] = n;
    });

    const failData = failEdges.map((fe) => ({
      source: idToNode[fe.sourceId],
      target: idToNode[fe.targetId],
    }));

    g.selectAll(".fail-link")
      .data(failData)
      .enter()
      .append("path")
      .attr("class", "fail-link")
      .attr("d", (d) => diagonal(d.source, d.target));

    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    g.selectAll("circle,text,path").each(function () {
      const bbox = this.getBBox();
      if (bbox.x < x0) x0 = bbox.x;
      if (bbox.y < y0) y0 = bbox.y;
      if (bbox.x + bbox.width > x1) x1 = bbox.x + bbox.width;
      if (bbox.y + bbox.height > y1) y1 = bbox.y + bbox.height;
    });

    const contentWidth = x1 - x0;
    const contentHeight = y1 - y0;
    const margin = 20;
    const scale = Math.min(
      (width - margin * 2) / contentWidth,
      (height - margin * 2) / contentHeight
    );
    const translateX = margin - x0 * scale;
    const translateY = margin - y0 * scale;
    g.attr(
      "transform",
      `translate(${translateX},${translateY}) scale(${scale})`
    );

    function diagonal(s, t) {
      const start = { x: s.x, y: s.y };
      const end = { x: t.x, y: t.y };

      return `
          M ${start.y},${start.x}
          C ${(start.y + end.y) / 2},${start.x},
            ${(start.y + end.y) / 2},${end.x},
            ${end.y},${end.x}
        `;
    }
    function midpoint(s, t) {
      return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 };
    }
  }
});
