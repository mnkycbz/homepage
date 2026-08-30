/* ===========================================================
   Site interactions: theme toggle + post rendering.
   No frameworks, no build step.
   =========================================================== */

(function () {
  "use strict";

  /* ---------- Privacy-friendly analytics (GoatCounter) ----------
     No cookies, no personal tracking. To enable: sign up free at
     https://www.goatcounter.com , grab your code (the subdomain before
     .goatcounter.com), and put it in GOATCOUNTER_CODE below. Leave empty
     to load no third-party script at all. */
  const GOATCOUNTER_CODE = "mnkycbz";

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  function themeIcon(t) {
    // t = current theme; show icon for switching TO the other
    return t === "dark"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
  }

  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    const btn = document.querySelector(".theme-btn");
    if (btn) btn.innerHTML = themeIcon(t);
  }
  applyTheme(initial);

  document.addEventListener("click", function (e) {
    if (e.target.closest(".theme-btn")) {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    }
  });

  /* ---------- Sakura petals ---------- */
  (function spawnPetals() {
    const box = document.getElementById("petals");
    if (!box) return;
    const N = window.matchMedia("(max-width: 600px)").matches ? 5 : 8;
    let html = "";
    for (let i = 0; i < N; i++) {
      const left = Math.random() * 100;
      const size = 9 + Math.random() * 10;
      const dur = 9 + Math.random() * 9;
      const delay = -Math.random() * dur;
      const op = 0.55 + Math.random() * 0.35;
      html +=
        '<span class="petal" style="left:' + left.toFixed(1) + "%;width:" + size.toFixed(0) +
        "px;height:" + size.toFixed(0) + "px;opacity:" + op.toFixed(2) +
        ";animation-duration:" + dur.toFixed(1) + "s;animation-delay:" + delay.toFixed(1) + 's"></span>';
    }
    box.innerHTML = html;
  })();

  /* ---------- Helpers ---------- */
  function fmtDate(s) {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var calIcon =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'style="vertical-align:-2px;margin-right:5px;opacity:.7"><rect x="3" y="5" width="18" height="16" rx="2"/>' +
    '<path d="M8 3v4M16 3v4M3 10h18"/></svg>';

  /* ---------- 数据加载：优先 fetch posts.json（Decap CMS 管理），失败回退 window.POSTS（本地预览） ---------- */
  function withPosts(cb) {
    if (!window.fetch) { cb(window.POSTS || []); return; }
    fetch("assets/data/posts.json")
      .then(function (r) { if (!r.ok) throw new Error("json missing"); return r.json(); })
      .then(function (d) {
        cb(Array.isArray(d.posts) ? d.posts : (Array.isArray(d) ? d : []));
      })
      .catch(function () { cb(window.POSTS || []); });
  }

  /* ---------- Blog list (+ cover, tag filter, search) ---------- */
  withPosts(function (all) {
  const listEl = document.getElementById("post-list");
  if (listEl) {
    const posts = all.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    /* cover emoji: posts.js 里可给某篇加 icon:"🎮" 覆盖；否则按标签推断 */
    /* 越靠前优先级越高：具体标签优先于笼统的「随笔」，让相邻卡片 emoji 不重样 */
    const TAG_EMOJI = {
      "宣传": "📣", "足球": "⚽", "建站": "🛠️", "设计": "🎨",
      "技术": "💻", "折腾": "🔧", "日常": "☕", "追番": "📺",
      "游戏": "🎮", "学习": "📚", "碎碎念": "💭", "二次元": "🎐",
      "生活": "🍵", "随笔": "🌸"
    };
    function coverEmoji(p) {
      if (p.icon) return p.icon;
      const t = p.tags || [];
      const keys = Object.keys(TAG_EMOJI); // 按上面定义顺序匹配，具体标签优先于「随笔」
      for (let i = 0; i < keys.length; i++) {
        if (t.indexOf(keys[i]) >= 0) return TAG_EMOJI[keys[i]];
      }
      return "📝";
    }
    function cardHTML(p, i) {
      const tags = (p.tags || [])
        .map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; })
        .join("");
      return (
        '<a class="post-card reveal" href="post.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="post-cover g' + (i % 3) + '">' + coverEmoji(p) + "</div>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<div class="excerpt">' + esc(p.excerpt || "") + "</div>" +
        '<div class="post-meta"><span>' + calIcon + fmtDate(p.date) + "</span>" + tags + "</div>" +
        "</a>"
      );
    }
    function renderList(list) {
      listEl.innerHTML = list.map(cardHTML).join("");
      observeReveal(); // 新插入的卡片也要有滚动渐入
    }
    renderList(posts);

    /* 标签筛选 + 搜索（只在含这些控件的页面启用，如 blog.html） */
    const filterEl = document.getElementById("tagFilters");
    const searchEl = document.getElementById("postSearch");
    const emptyEl = document.getElementById("empty");
    if (filterEl || searchEl) {
      let activeTag = "全部";

      if (filterEl) {
        const seen = [];
        posts.forEach(function (p) {
          (p.tags || []).forEach(function (t) { if (seen.indexOf(t) < 0) seen.push(t); });
        });
        filterEl.innerHTML = ["全部"].concat(seen)
          .map(function (t, i) {
            return '<button class="filter' + (i === 0 ? " active" : "") + '" data-tag="' + esc(t) + '">' +
              (i === 0 ? "全部" : "#" + esc(t)) + "</button>";
          })
          .join("");
        filterEl.addEventListener("click", function (e) {
          const b = e.target.closest(".filter");
          if (!b) return;
          activeTag = b.getAttribute("data-tag");
          Array.prototype.forEach.call(filterEl.querySelectorAll(".filter"), function (x) {
            x.classList.toggle("active", x === b);
          });
          applyFilters();
        });
      }
      if (searchEl) searchEl.addEventListener("input", applyFilters);

      function applyFilters() {
        const q = (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();
        const out = posts.filter(function (p) {
          if (activeTag !== "全部" && (p.tags || []).indexOf(activeTag) < 0) return false;
          if (!q) return true;
          const plain = String(p.content || "").replace(/<[^>]+>/g, " "); // 去掉 HTML 标签再搜正文
          const hay = (p.title + " " + (p.excerpt || "") + " " + (p.tags || []).join(" ") + " " + plain).toLowerCase();
          return hay.indexOf(q) >= 0;
        });
        renderList(out);
        if (emptyEl) {
          if (!out.length) {
            emptyEl.style.display = "";
            emptyEl.innerHTML = q
              ? '没有匹配「' + esc(q) + '」的文章，换个词试试？'
              : "这个标签下还没有文章。";
          } else {
            emptyEl.style.display = "none";
          }
        }
      }
    }
  }
  });

  /* ---------- Post detail ---------- */
  withPosts(function (all) {
  const detailEl = document.getElementById("post-detail");
  if (detailEl) {
    const id = new URLSearchParams(location.search).get("id");
    const post = all.find(function (p) { return p.id === id; });
    if (post) {
      const tags = (post.tags || [])
        .map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; })
        .join("");
      detailEl.innerHTML =
        '<a class="back-link" href="blog.html">← 返回博客</a>' +
        "<h1>" + esc(post.title) + "</h1>" +
        '<div class="post-meta"><span>' + calIcon + fmtDate(post.date) + "</span>" + tags +
        '<span class="read-time" id="readTime"></span></div>' +
        // 正文：优先用 marked 渲染（支持 Markdown 写作）；加载失败则原样输出（旧 HTML 文章不受影响）
        '<div class="prose">' + (window.marked ? window.marked.parse(post.content) : post.content) + "</div>";
      document.title = post.title + " · 猫你可以吃包子";

      // reading time + table of contents
      const prose = detailEl.querySelector(".prose");
      const textLen = (prose.textContent || "").replace(/\s/g, "").length;
      const minutes = Math.max(1, Math.round(textLen / 400));
      const rt = document.getElementById("readTime");
      if (rt) rt.textContent = "约 " + minutes + " 分钟";

      const heads = Array.prototype.slice.call(prose.querySelectorAll("h2"));
      if (heads.length >= 2) {
        heads.forEach(function (h, i) { if (!h.id) h.id = "sec-" + i; });
        const toc =
          '<nav class="toc reveal" aria-label="目录">' +
          '<div class="toc-title">目录</div><ul>' +
          heads
            .map(function (h) {
              return '<li><a href="#' + h.id + '">' + esc(h.textContent) + "</a></li>";
            })
            .join("") +
          "</ul></nav>";
        prose.insertAdjacentHTML("beforebegin", toc);
      }
    } else {
      detailEl.innerHTML = '<p class="empty">没有找到这篇文章。<a href="blog.html">回到博客</a></p>';
    }
  }
  });

  /* ---------- Active nav ---------- */
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });

  /* ---------- Reading progress + back to top ---------- */
  const progress = document.getElementById("progress");
  const toTop = document.getElementById("toTop");
  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const scrolled = doc.scrollTop || document.body.scrollTop || window.scrollY || 0;
    const p = max > 0 ? scrolled / max : 0;
    if (progress) progress.style.width = (p * 100).toFixed(2) + "%";
    if (toTop) toTop.classList.toggle("show", scrolled > 320);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  /* 抽成函数：动态渲染的卡片（筛选/搜索后）也要重新观察 */
  function observeReveal() {
    const els = document.querySelectorAll(".reveal:not([data-observed])");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (el) {
        el.classList.add("in");
        el.setAttribute("data-observed", "1");
      });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(els, function (el) {
      el.setAttribute("data-observed", "1");
      io.observe(el);
    });
  }
  observeReveal();

  /* ---------- Analytics (only if a code is set) ---------- */
  if (GOATCOUNTER_CODE) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://gc.zgo.at/count.js";
    ga.setAttribute("data-goatcounter", "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count");
    document.head.appendChild(ga);
  }

  /* ============ v2.0 液态玻璃交互层 ============ */

  /* 导航：滚动时底部折射边增强 */
  (function () {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", (window.scrollY || document.documentElement.scrollTop) > 8);
    }, { passive: true });
  })();

  /* 导航玻璃：折射光斑跟随鼠标（js 更新 --shine-x） */
  (function () {
    var nav = document.querySelector(".nav");
    var glass = nav ? nav.querySelector(".nav-glass") : null;
    if (!nav || !glass) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var shine = 50, target = 50, raf = null;
    nav.addEventListener("mousemove", function (e) {
      var r = nav.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width) * 100;
      if (!raf) raf = requestAnimationFrame(step);
    });
    nav.addEventListener("mouseleave", function () { target = 50; });
    function step() {
      shine += (target - shine) * 0.16;
      glass.style.setProperty("--shine-x", shine.toFixed(1) + "%");
      if (Math.abs(target - shine) > 0.4) { raf = requestAnimationFrame(step); }
      else { raf = null; }
    }
  })();

  /* 导航选中项：液态玻璃胶囊（悬停自动跟随 + 点击定 active） */
  (function () {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[data-nav]"));
    var pill = document.querySelector(".nav-pill");
    if (!pill || !navLinks.length) return;
    function movePill(a) {
      if (!a) return;
      pill.style.width = a.offsetWidth + "px";
      pill.style.transform = "translateX(" + a.offsetLeft + "px)";
    }
    movePill(document.querySelector(".nav-links a.active"));
    navLinks.forEach(function (a) {
      a.addEventListener("mouseenter", function () { movePill(a); });
      a.addEventListener("click", function () {
        navLinks.forEach(function (x) { x.classList.remove("active"); });
        a.classList.add("active");
        movePill(a);
      });
    });
    window.addEventListener("resize", function () {
      movePill(document.querySelector(".nav-links a.active"));
    });
  })();

  /* 全局光斑跟随鼠标 */
  (function () {
    var glow = document.getElementById("glowFollow");
    if (!glow || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var x = window.innerWidth / 2, y = 220, tx = x, ty = y, raf = null;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    function step() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      glow.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%,-50%)";
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) { raf = requestAnimationFrame(step); }
      else { raf = null; }
    }
  })();

  /* 鼠标跟随光圈（经过头像自动让开） */
  (function () {
    var ring = document.getElementById("cursorRing");
    if (!ring || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var mx = window.innerWidth / 2, my = 220, rx = mx, ry = my, raf = null;
    ring.style.opacity = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      ring.style.opacity = 1;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    function step() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px) translate(-50%,-50%)";
      if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) { raf = requestAnimationFrame(step); }
      else { raf = null; }
    }
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(".avatar-wrap")) { ring.classList.remove("grow"); ring.classList.add("hide"); return; }
      if (e.target.closest("a, button, .interest, .post-card, .link-card, input")) ring.classList.add("grow");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(".avatar-wrap")) { ring.classList.remove("hide"); return; }
      if (e.target.closest("a, button, .interest, .post-card, .link-card, input")) ring.classList.remove("grow");
    });
    document.documentElement.addEventListener("mouseleave", function () { ring.style.opacity = 0; });
    document.documentElement.addEventListener("mouseenter", function () { ring.style.opacity = 1; });
  })();
})();
