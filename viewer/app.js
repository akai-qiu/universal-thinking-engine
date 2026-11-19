(function () {
  "use strict";
  var DATA = window.KB_DATA || { knowledge: [], memory: [], evolution: [] };
  var CAT_COLORS = {
    "00-核心框架": "#534ab7",
    "01-认知与思维": "#185fa5",
    "02-问题与决策": "#1d9e75",
    "03-系统与执行": "#ba7517",
    "04-审查与验证": "#d85a30",
    "05-反馈与进化": "#993556"
  };

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---- minimal markdown renderer ----
  function mdRender(src) {
    var lines = src.split("\n");
    var out = [], inList = false, inCode = false, codeBuf = [];
    function closeList() { if (inList) { out.push("</ul>"); inList = false; } }
    function inline(s) {
      return esc(s)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^```/.test(line)) {
        if (inCode) { out.push("<pre>" + esc(codeBuf.join("\n")) + "</pre>"); codeBuf = []; inCode = false; }
        else { closeList(); inCode = true; }
        continue;
      }
      if (inCode) { codeBuf.push(line); continue; }
      var h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        closeList();
        var lvl = h[1].length;
        out.push(lvl === 1 ? "<h1>" + inline(h[2]) + "</h1>"
          : lvl === 2 ? "<h2>" + inline(h[2]) + "</h2>"
          : "<h3>" + inline(h[2]) + "</h3>");
        continue;
      }
      if (/^---+\s*$/.test(line)) { closeList(); out.push("<hr>"); continue; }
      var li = line.match(/^\s*[-*]\s+(.*)$/) || line.match(/^\s*\d+\.\s+(.*)$/);
      if (li) {
        if (!inList) { out.push("<ul>"); inList = true; }
        out.push("<li>" + inline(li[1]) + "</li>");
        continue;
      }
      var bq = line.match(/^>\s?(.*)$/);
      if (bq) { closeList(); out.push("<blockquote>" + inline(bq[1]) + "</blockquote>"); continue; }
      if (line.trim() === "") { closeList(); continue; }
      closeList();
      out.push("<p>" + inline(line) + "</p>");
    }
    closeList();
    if (inCode) out.push("<pre>" + esc(codeBuf.join("\n")) + "</pre>");
    return out.join("\n");
  }

  function statusChip(status) {
    if (!status) return "";
    return '<span class="chip ' + esc(status) + '">' + esc(status) + "</span>";
  }

  // ---- tab routing ----
  var tabs = document.querySelectorAll("#tabs button");
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      $("#tab-" + b.dataset.tab).classList.add("active");
      renderTab(b.dataset.tab);
    });
  });

  var currentDoc = DATA.knowledge.find(function (e) { return e.title === "总体架构"; }) || DATA.knowledge[0];

  function renderTab(name) {
    if (name === "overview") renderOverview();
    if (name === "map") renderMap();
    if (name === "browse") renderBrowse();
    if (name === "cases") renderCases();
    if (name === "evolution") renderEvolution();
    if (name === "history") renderHistory();
  }

  // ---- overview ----
  function renderOverview() {
    var t = $("#tab-overview");
    var kn = DATA.knowledge.filter(function (e) { return !e.is_readme; });
    var counts = {};
    ["validated", "experimental", "pending_review", "draft", "deprecated"].forEach(function (s) {
      counts[s] = kn.filter(function (e) { return e.status === s; }).length;
    });
    var cats = {};
    kn.forEach(function (e) { (cats[e.category] = cats[e.category] || []).push(e); });
    var html = '<h2 class="page-title">知识总览</h2>';
    html += '<div class="stats">' +
      '<div class="stat-card"><div class="num">' + kn.length + "</div><div class='label'>知识条目</div></div>" +
      '<div class="stat-card"><div class="num">' + Object.keys(cats).length + "</div><div class='label'>分类层</div></div>" +
      '<div class="stat-card"><div class="num">' + DATA.memory.length + "</div><div class='label'>个人记忆</div></div>" +
      '<div class="stat-card"><div class="num">' + DATA.evolution.length + "</div><div class='label'>进化记录</div></div>" +
      "</div>";
    html += '<div class="status-row">' +
      '<span class="chip validated">validated ' + counts.validated + "</span>" +
      '<span class="chip experimental">experimental ' + counts.experimental + "</span>" +
      '<span class="chip draft">draft ' + counts.draft + "</span>" +
      '<span class="chip deprecated">deprecated ' + counts.deprecated + "</span>" +
      "</div>";
    Object.keys(cats).sort().forEach(function (c) {
      html += '<div class="cat-section"><h3>' + esc(c) + "</h3><div class='entry-list'>";
      cats[c].forEach(function (e) {
        html += '<div class="entry-card" data-file="' + esc(e.file) + '">' +
          '<div class="title"><span>' + esc(e.title) + "</span>" + statusChip(e.status) + "</div>" +
          '<div class="meta">' + esc(e.version ? "v" + e.version : "") + (e.confidence ? " · 置信度 " + esc(e.confidence) : "") + "</div>" +
          (e.tags && e.tags.length ? '<div class="tag-row">' + e.tags.slice(0, 3).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
          "</div>";
      });
      html += "</div></div>";
    });
    t.innerHTML = html;
    t.querySelectorAll(".entry-card").forEach(function (card) {
      card.addEventListener("click", function () {
        openBrowseDoc(card.dataset.file);
        switchTab("browse");
      });
    });
  }

  function switchTab(name) {
    var b = document.querySelector('#tabs button[data-tab="' + name + '"]');
    if (b) b.click();
  }

  // ---- map (radial graph) ----
  function renderMap() {
    var t = $("#tab-map");
    var nodes = DATA.knowledge.filter(function (e) { return !e.is_readme && (e.status === "validated" || e.status === "pending_review"); });
    var W = 1000, H = 620, cx = W / 2, cy = H / 2;
    var catList = Object.keys(CAT_COLORS);
    var radius = 225;
    var pos = {};
    var byCat = {};
    nodes.forEach(function (e) { (byCat[e.category] = byCat[e.category] || []).push(e); });
    var catIndex = {};
    catList.forEach(function (c, i) { catIndex[c] = i; });
    Object.keys(byCat).forEach(function (c) {
      var idx = catIndex[c] !== undefined ? catIndex[c] : catList.length;
      var members = byCat[c];
      var arcSpan = (2 * Math.PI) / catList.length;
      var base = idx * arcSpan - Math.PI / 2;
      members.forEach(function (e, i) {
        var angle = base + (arcSpan * (i + 0.5)) / members.length;
        pos[e.id] = {
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
          color: CAT_COLORS[c] || "#888780"
        };
      });
    });
    var svg = '<svg id="map-svg" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg">';
    // edges
    var idSet = {};
    nodes.forEach(function (e) { idSet[e.id] = 1; });
    nodes.forEach(function (e) {
      (e.related || []).forEach(function (r) {
        var p = pos[e.id], q = pos[r];
        if (p && q && e.id < r) {
          svg += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '" stroke="rgba(44,44,42,0.12)" stroke-width="1"/>';
        }
      });
    });
    // nodes
    nodes.forEach(function (e) {
      var p = pos[e.id];
      if (!p) return;
      svg += '<g data-id="' + esc(e.id) + '" style="cursor:pointer">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="7" fill="' + p.color + '"/>' +
        '<text x="' + p.x + '" y="' + (p.y - 13) + '" text-anchor="middle" font-size="12" fill="#2c2c2a">' + esc(e.title) + "</text></g>";
    });
    // center
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="46" fill="#f1efe8" stroke="rgba(44,44,42,0.3)"/>' +
      '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central" font-size="13" fill="#2c2c2a">方法论地图</text>';
    svg += "</svg>";
    var legend = catList.map(function (c) {
      return '<span><span class="legend-dot" style="background:' + CAT_COLORS[c] + '"></span>' + esc(c) + "</span>";
    }).join("");
    t.innerHTML = '<h2 class="page-title">知识地图</h2>' + svg +
      '<div class="map-legend">' + legend + '<span style="margin-left:auto">节点间连线 = related 关联 · 点击节点查看条目</span></div>' +
      '<div id="map-detail"></div>';
    t.querySelectorAll("#map-svg g[data-id]").forEach(function (g) {
      g.addEventListener("click", function () {
        var entry = nodes.find(function (e) { return e.id === g.dataset.id; });
        if (!entry) return;
        var d = $("#map-detail");
        d.innerHTML = '<div class="article" style="margin-top:16px">' + entryCardHtml(entry) + mdRender(entry.content) + "</div>";
        d.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function entryCardHtml(e) {
    return '<div class="fm-meta">' + statusChip(e.status) +
      '<span class="chip" style="background:var(--gray-light)">' + esc(e.category) + "</span>" +
      (e.version ? '<span class="chip" style="background:var(--gray-light)">v' + esc(e.version) + "</span>" : "") +
      (e.confidence ? '<span class="chip" style="background:var(--gray-light)">置信度 ' + esc(e.confidence) + "</span>" : "") +
      "</div><h1>" + esc(e.title) + "</h1>";
  }

  // ---- browse ----
  function renderBrowse() {
    var t = $("#tab-browse");
    var kn = DATA.knowledge;
    var groups = {};
    kn.forEach(function (e) { (groups[e.category] = groups[e.category] || []).push(e); });
    var side = '<input id="search-box" type="search" placeholder="搜索标题、标签、内容…">';
    Object.keys(groups).sort().forEach(function (c) {
      side += '<div class="side-group"><h4>' + esc(c) + "</h4>";
      groups[c].forEach(function (e) {
        side += '<a class="side-item" data-file="' + esc(e.file) + '">' + esc(e.title) +
          (e.status && e.status !== "validated" ? ' <span class="chip ' + esc(e.status) + '">' + esc(e.status) + "</span>" : "") + "</a>";
      });
      side += "</div>";
    });
    t.innerHTML = '<h2 class="page-title">知识浏览</h2><div class="layout"><div class="sidebar">' + side + '</div><div class="article" id="doc-view"></div></div>';
    showDoc(currentDoc);
    t.querySelectorAll(".side-item").forEach(function (a) {
      a.addEventListener("click", function () {
        var entry = kn.find(function (e) { return e.file === a.dataset.file; });
        if (entry) showDoc(entry);
      });
    });
    $("#search-box").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      t.querySelectorAll(".side-item").forEach(function (a) {
        var entry = kn.find(function (e) { return e.file === a.dataset.file; });
        var hay = (entry.title + " " + entry.tags.join(" ") + " " + entry.content).toLowerCase();
        a.style.display = (!q || hay.indexOf(q) >= 0) ? "" : "none";
      });
      var groupsEl = t.querySelectorAll(".side-group");
      groupsEl.forEach(function (g) {
        var visible = Array.prototype.some.call(g.querySelectorAll(".side-item"), function (a) { return a.style.display !== "none"; });
        g.style.display = visible ? "" : "none";
      });
    });
  }

  function showDoc(entry) {
    currentDoc = entry;
    var v = $("#doc-view");
    if (!v) return;
    v.innerHTML = entryCardHtml(entry) + mdRender(entry.content);
    v.scrollTop = 0;
  }

  function openBrowseDoc(file) {
    currentDoc = DATA.knowledge.find(function (e) { return e.file === file; }) || currentDoc;
    renderBrowse();
  }

  // ---- cases & experiments ----
  function renderCases() {
    var t = $("#tab-cases");
    var readme = DATA.knowledge.filter(function (e) { return e.is_readme; });
    var cases = DATA.knowledge.filter(function (e) { return e.category === "06-案例库" && !e.is_readme; });
    var exps = DATA.knowledge.filter(function (e) { return e.category === "07-实验库" && !e.is_readme; });
    var pend = DATA.knowledge.filter(function (e) { return e.category === "08-待审核知识" && !e.is_readme; });
    var html = '<h2 class="page-title">案例与实验</h2>';
    html += '<h3 style="margin:10px 0 8px;font-weight:500">案例库（' + cases.length + '）</h3>';
    html += cases.length ? cases.map(function (e) { return '<div class="entry-card" style="margin-bottom:8px"><div class="title">' + esc(e.title) + statusChip(e.status) + "</div><div class='meta'>" + esc(e.date || "") + "</div></div>" + '<div class="article" style="margin-bottom:18px">' + mdRender(e.content) + "</div>"; }).join("") : '<div class="empty">暂无案例。完成 M/L 级任务后按 README 模板归档。</div>';
    html += "<h3 style='margin:22px 0 8px;font-weight:500'>实验库（" + exps.length + "）</h3>";
    html += exps.length ? exps.map(function (e) { return '<div class="article" style="margin-bottom:18px">' + entryCardHtml(e) + mdRender(e.content) + "</div>"; }).join("") : '<div class="empty">暂无进行中的实验。新方法先入实验库，2 次验证后送审。</div>';
    html += "<h3 style='margin:22px 0 8px;font-weight:500'>待审核（" + pend.length + "）</h3>";
    html += pend.length ? pend.map(function (e) { return '<div class="article" style="margin-bottom:18px">' + entryCardHtml(e) + mdRender(e.content) + "</div>"; }).join("") : '<div class="empty">暂无待审批条目。</div>';
    html += '<details style="margin-top:16px"><summary style="cursor:pointer;color:var(--muted);font-size:13px">查看归档规则（README）</summary>' + readme.map(function (e) { return '<div class="article" style="margin-top:10px">' + mdRender(e.content) + "</div>"; }).join("") + "</details>";
    t.innerHTML = html;
  }

  // ---- evolution ----
  function renderEvolution() {
    var t = $("#tab-evolution");
    var html = '<h2 class="page-title">进化中心</h2>';
    if (!DATA.evolution.length) { t.innerHTML = html + '<div class="empty">暂无进化记录。</div>'; return; }
    html += DATA.evolution.map(function (e) {
      return '<div class="article" style="margin-bottom:18px"><div class="fm-meta"><span class="chip" style="background:var(--gray-light)">' + esc(e.file) + "</span></div>" + mdRender(e.content) + "</div>";
    }).join("");
    html += "<h3 style='margin:18px 0 8px;font-weight:500'>个人记忆</h3>";
    html += DATA.memory.map(function (e) {
      return '<details style="margin-bottom:8px"><summary style="cursor:pointer;font-size:13px">' + esc(e.file) + "</summary>" +
        '<div class="article" style="margin-top:8px">' + mdRender(e.content) + "</div></details>";
    }).join("");
    t.innerHTML = html;
  }

  // ---- history ----
  function renderHistory() {
    var t = $("#tab-history");
    var log = DATA.evolution.find(function (e) { return e.file === "版本变更日志.md"; });
    t.innerHTML = '<h2 class="page-title">版本历史</h2><div class="article">' +
      (log ? mdRender(log.content) : '<div class="empty">暂无变更日志。</div>') + "</div>";
  }

  $("#gen-at").textContent = DATA.generated_at || "未知";
  renderOverview();
})();
