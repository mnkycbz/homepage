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

  /* ---------- Blog list ---------- */
  const listEl = document.getElementById("post-list");
  if (listEl && window.POSTS) {
    const posts = window.POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    listEl.innerHTML = posts
      .map(function (p) {
        const tags = (p.tags || [])
          .map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; })
          .join("");
        return (
          '<a class="post-card reveal" href="post.html?id=' + encodeURIComponent(p.id) + '">' +
          "<h3>" + esc(p.title) + "</h3>" +
          '<div class="excerpt">' + esc(p.excerpt || "") + "</div>" +
          '<div class="post-meta"><span>' + calIcon + fmtDate(p.date) + "</span>" + tags + "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  /* ---------- Post detail ---------- */
  const detailEl = document.getElementById("post-detail");
  if (detailEl && window.POSTS) {
    const id = new URLSearchParams(location.search).get("id");
    const post = window.POSTS.find(function (p) { return p.id === id; });
    if (post) {
      const tags = (post.tags || [])
        .map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; })
        .join("");
      detailEl.innerHTML =
        '<a class="back-link" href="blog.html">← 返回博客</a>' +
        "<h1>" + esc(post.title) + "</h1>" +
        '<div class="post-meta"><span>' + calIcon + fmtDate(post.date) + "</span>" + tags +
        '<span class="read-time" id="readTime"></span></div>' +
        '<div class="prose">' + post.content + "</div>";
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
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Analytics (only if a code is set) ---------- */
  if (GOATCOUNTER_CODE) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://gc.zgo.at/count.js";
    ga.setAttribute("data-goatcounter", "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count");
    document.head.appendChild(ga);
  }
})();
