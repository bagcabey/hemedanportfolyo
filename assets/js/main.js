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
      var scope = a.closest(".chapter, .hpin, section") || document;
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

  /* ---------- Awwwards Akışkan Editöryal Kanvas & İmleç Fiziği ---------- */
  var awStage = document.querySelector(".aw-stage");
  var awCanvas = document.querySelector(".aw-canvas");
  if (awStage && awCanvas && !reduce) {
    var ctx = awCanvas.getContext("2d");
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var ptr = { x: 0.55, y: 0.45, tx: 0.55, ty: 0.45, active: false };
    var t = 0;

    /* Yüzen editoryal mürekkep / sayfa parçacıkları */
    var motes = Array.from({ length: 34 }, function (_, i) {
      return {
        x: Math.random(),
        y: Math.random(),
        r: 1.2 + (i % 4) * 0.7,
        vx: (Math.random() - 0.5) * 0.00035,
        vy: -0.00018 - Math.random() * 0.00028,
        accent: i % 5 === 0
      };
    });

    function resizeCanvas() {
      var rect = awStage.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      awCanvas.width = Math.round(w * dpr);
      awCanvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    awStage.addEventListener("pointermove", function (e) {
      var rect = awStage.getBoundingClientRect();
      ptr.tx = (e.clientX - rect.left) / Math.max(1, rect.width);
      ptr.ty = (e.clientY - rect.top) / Math.max(1, rect.height);
      ptr.active = true;
      awStage.style.setProperty("--cx", (ptr.tx * 100).toFixed(1) + "%");
      awStage.style.setProperty("--cy", (ptr.ty * 100).toFixed(1) + "%");
    });
    awStage.addEventListener("pointerleave", function () { ptr.active = false; });

    function drawRibbon(phase, yRatio, amp, alpha, color, width) {
      ctx.beginPath();
      var steps = 42;
      for (var i = 0; i <= steps; i++) {
        var u = i / steps;
        var x = u * w;
        var dx = u - ptr.x;
        var dy = yRatio - ptr.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var repel = Math.exp(-dist * dist * 14) * (ptr.active ? 54 : 18) * (dy >= 0 ? 1 : -1);
        var y = yRatio * h
          + Math.sin(u * 4.2 + t * 0.9 + phase) * amp
          + Math.cos(u * 2.1 - t * 0.55 + phase) * (amp * 0.45)
          + repel;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    function frame() {
      t += 0.016;
      ptr.x += (ptr.tx - ptr.x) * 0.07;
      ptr.y += (ptr.ty - ptr.y) * 0.07;

      ctx.clearRect(0, 0, w, h);

      /* İpek kurdele / sayfa kıvrımı dalgaları */
      drawRibbon(0.0, 0.34, 24, 0.22, "#C8312B", 1.35);
      drawRibbon(0.9, 0.40, 18, 0.12, "#C8312B", 0.9);
      drawRibbon(1.8, 0.68, 22, 0.11, "#111111", 1.0);
      drawRibbon(2.6, 0.74, 15, 0.07, "#111111", 0.75);

      /* Mürekkep zerreleri */
      motes.forEach(function (m) {
        m.x += m.vx + Math.sin(t * 0.6 + m.y * 6) * 0.00012;
        m.y += m.vy;
        if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
        if (m.x < -0.05) m.x = 1.05;
        if (m.x > 1.05) m.x = -0.05;

        var px = m.x * w, py = m.y * h;
        var dx = px - ptr.x * w, dy = py - ptr.y * h;
        var d2 = dx * dx + dy * dy;
        if (ptr.active && d2 < 22000 && d2 > 1) {
          var f = (1 - d2 / 22000) * 1.6;
          px += (dx / Math.sqrt(d2)) * f * 18;
          py += (dy / Math.sqrt(d2)) * f * 18;
        }
        ctx.beginPath();
        ctx.arc(px, py, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.accent ? "#C8312B" : "#111111";
        ctx.globalAlpha = m.accent ? 0.34 : 0.16;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    requestAnimationFrame(frame);
  }
})();
