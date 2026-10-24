/* Editör Bakış — bağımlılıksız etkileşimler ve kaydırma animasyon motoru */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");
  if (!reduce) doc.classList.add("fx");

  /* Yıl */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Metni harf / kelime parçalarına ayır ---------- */
  function splitLetters(el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var i = 0;
    text.split(" ").forEach(function (word, wi) {
      if (wi) el.appendChild(document.createTextNode(" "));
      var w = document.createElement("span");
      w.className = "wd"; w.setAttribute("aria-hidden", "true");
      Array.from(word).forEach(function (c) {
        var s = document.createElement("span");
        s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i++);
        w.appendChild(s);
      });
      el.appendChild(w);
    });
  }
  function splitWords(el) {
    var n = 0, nodes = Array.from(el.childNodes);
    el.textContent = "";
    nodes.forEach(function (node) {
      if (node.nodeType !== 3) { el.appendChild(node); return; }
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(" ")); return; }
        var s = document.createElement("span");
        s.className = "w"; s.textContent = part; s.style.setProperty("--i", n++);
        el.appendChild(s);
      });
    });
    el.style.setProperty("--n", n);
  }
  if (!reduce) {
    document.querySelectorAll(".split-letters").forEach(splitLetters);
    document.querySelectorAll(".words").forEach(splitWords);
  }

  /* ---------- Mobil menü ---------- */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("ana-menu");
  if (btn && nav) {
    var closeMenu = function () { nav.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------- Kaydırma animasyon motoru ---------- */
  var bar = document.querySelector(".progress");
  var pill = document.querySelector(".pill");
  var contact = document.getElementById("iletisim");
  var items = Array.from(document.querySelectorAll("[data-fx]")).map(function (el) {
    return { el: el, types: el.getAttribute("data-fx").split(" "), lag: parseFloat(el.getAttribute("data-lag") || "0"), last: {} };
  });
  var hpins = Array.from(document.querySelectorAll(".hpin"));
  var vh = window.innerHeight, ticking = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function set(item, prop, v) {
    v = Math.round(v * 1000) / 1000;
    if (item.last[prop] !== v) { item.last[prop] = v; item.el.style.setProperty(prop, v); }
  }

  function layoutPins() {
    vh = window.innerHeight;
    if (reduce) return;
    hpins.forEach(function (sec) {
      var track = sec.querySelector(".hpin-track");
      var dist = Math.max(0, track.scrollWidth - window.innerWidth);
      sec.style.setProperty("--dist", dist + "px");
      sec.style.setProperty("--hh", (dist + vh * 1.15) + "px");
    });
  }

  function update() {
    ticking = false;
    var max = doc.scrollHeight - vh;
    if (bar) bar.style.setProperty("--p", (max > 0 ? window.scrollY / max : 0).toFixed(4));
    if (pill) {
      var hide = window.scrollY < vh * 0.5 || (contact && contact.getBoundingClientRect().top < vh * 0.6);
      pill.classList.toggle("is-hidden", hide);
    }
    if (reduce) return;
    var rects = items.map(function (it) { return it.el.getBoundingClientRect(); });
    items.forEach(function (it, k) {
      var r = rects[k];
      it.types.forEach(function (t) {
        if (t === "in") set(it, "--in", easeOut(clamp((vh - r.top - it.lag * vh) / (vh * 0.55))));
        else if (t === "wide") set(it, "--in", easeOut(clamp((vh - r.top) / (vh * 0.85))));
        else if (t === "read") set(it, "--in", clamp((vh * 0.95 - r.top) / (r.height + vh * 0.45)));
        else if (t === "out") set(it, "--out", clamp((vh * 0.3 - r.bottom) / (vh * 0.3)));
        else if (t === "past") set(it, "--past", clamp(-r.top / Math.max(1, r.height)));
        else if (t === "pin") set(it, "--p", clamp(-r.top / Math.max(1, r.height - vh)));
      });
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { layoutPins(); onScroll(); });
  window.addEventListener("load", function () { layoutPins(); update(); });
  layoutPins();
  update();

  /* ---------- Aktif bölüm vurgusu ---------- */
  if ("IntersectionObserver" in window) {
    var links = document.querySelectorAll('.pill a[href^="#"], .main-nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { var id = a.getAttribute("href").slice(1); (map[id] = map[id] || []).push(a); });
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        (map[en.target.id] || []).forEach(function (a) { a.setAttribute("aria-current", "true"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------- Görsel önizleme kutusu (önceki / sonraki ile) ---------- */
  var dlg = document.querySelector(".lightbox");
  if (dlg && typeof dlg.showModal === "function") {
    var img = dlg.querySelector("img");
    var cap = dlg.querySelector(".lightbox-cap");
    var group = [], idx = 0, opener = null;
    function show(i) {
      idx = (i + group.length) % group.length;
      var a = group[idx], t = a.querySelector("img");
      img.src = a.getAttribute("href");
      img.alt = (t && t.alt) || a.getAttribute("aria-label") || "";
      cap.textContent = a.getAttribute("data-caption") || "";
      img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a.lb");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      opener = a;
      var scope = a.closest(".fan, .chapter, .hpin, section") || document;
      group = Array.from(scope.querySelectorAll("a.lb"));
      show(group.indexOf(a));
      dlg.showModal();
    });
    dlg.querySelector(".lightbox-close").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".lightbox-prev").addEventListener("click", function () { show(idx - 1); });
    dlg.querySelector(".lightbox-next").addEventListener("click", function () { show(idx + 1); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.classList.contains("lightbox-fig")) dlg.close(); });
    dlg.addEventListener("close", function () { img.removeAttribute("src"); if (opener) opener.focus({ preventScroll: true }); });
  }
})();
