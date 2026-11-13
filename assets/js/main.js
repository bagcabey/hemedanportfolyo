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

  /* ---------- Metinsiz Etkileşimli Sahne: Sayfalar, Mürekkep & Kelebekler ---------- */
  var awStage = document.querySelector(".aw-stage");
  var awCanvas = document.querySelector(".aw-canvas");
  var awEmblem = document.querySelector(".aw-emblem");
  if (awStage && awCanvas && !reduce) {
    var ctx = awCanvas.getContext("2d");
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false };
    var t = 0;

    /* Origami kelebekler (tırtıldan kelebeğe) */
    var butterflies = Array.from({ length: 14 }, function (_, i) {
      return {
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: 7 + (i % 4) * 3,
        phase: Math.random() * Math.PI * 2,
        speed: 5 + Math.random() * 4,
        crimson: i % 2 === 0
      };
    });

    /* İmleç izi ve tıklama mürekkep halkaları */
    var trail = [];
    var ripples = [];

    function resizeCanvas() {
      var rect = awStage.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      awCanvas.width = Math.round(w * dpr);
      awCanvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnBurst(nx, ny) {
      ripples.push({ x: nx * w, y: ny * h, r: 6, alpha: 0.55 });
      for (var i = 0; i < 6; i++) {
        var ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
        butterflies.push({
          x: nx,
          y: ny,
          vx: Math.cos(ang) * 0.006,
          vy: Math.sin(ang) * 0.006 - 0.002,
          size: 8 + Math.random() * 6,
          phase: Math.random() * Math.PI * 2,
          speed: 8 + Math.random() * 4,
          crimson: i % 2 === 0,
          temp: true,
          life: 1
        });
      }
    }

    awStage.addEventListener("pointermove", function (e) {
      var rect = awStage.getBoundingClientRect();
      ptr.tx = (e.clientX - rect.left) / Math.max(1, rect.width);
      ptr.ty = (e.clientY - rect.top) / Math.max(1, rect.height);
      ptr.active = true;
      awStage.style.setProperty("--cx", (ptr.tx * 100).toFixed(1) + "%");
      awStage.style.setProperty("--cy", (ptr.ty * 100).toFixed(1) + "%");
      if (awEmblem) {
        awEmblem.style.setProperty("--tx", ((ptr.tx - 0.5) * 26).toFixed(1) + "px");
        awEmblem.style.setProperty("--ty", ((ptr.ty - 0.5) * 18).toFixed(1) + "px");
        awEmblem.style.setProperty("--rx", ((0.5 - ptr.ty) * 18).toFixed(1) + "deg");
        awEmblem.style.setProperty("--ry", ((ptr.tx - 0.5) * 22).toFixed(1) + "deg");
      }
      trail.push({ x: ptr.tx * w, y: ptr.ty * h, r: 2.2 + Math.random() * 2, alpha: 0.5 });
      if (trail.length > 36) trail.shift();
    });

    awStage.addEventListener("pointerleave", function () {
      ptr.active = false;
      if (awEmblem) {
        awEmblem.style.setProperty("--tx", "0px");
        awEmblem.style.setProperty("--ty", "0px");
        awEmblem.style.setProperty("--rx", "0deg");
        awEmblem.style.setProperty("--ry", "0deg");
      }
    });

    awStage.addEventListener("pointerdown", function (e) {
      var rect = awStage.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / Math.max(1, rect.width);
      var ny = (e.clientY - rect.top) / Math.max(1, rect.height);
      spawnBurst(nx, ny);
    });

    function drawBookPages() {
      var cx = w * 0.5, cy = h * 0.54;
      var bookW = Math.min(w * 0.72, 620);
      var bookH = Math.min(h * 0.62, 260);
      var swayX = (ptr.x - 0.5) * 44;
      var swayY = (ptr.y - 0.5) * 22;

      for (var layer = 0; layer < 5; layer++) {
        var p = layer / 4;
        var lift = Math.sin(t * 1.1 + layer * 0.55) * 10 + swayY * (0.4 + p * 0.5);
        var spread = bookW * (0.44 + p * 0.05);
        var hOff = bookH * (0.42 - p * 0.03);

        ctx.beginPath();
        /* Sol sayfa kanadı */
        ctx.moveTo(cx + swayX * 0.15, cy - hOff * 0.65);
        ctx.bezierCurveTo(
          cx - spread * 0.45, cy - hOff - lift * 0.6,
          cx - spread * 0.85, cy - hOff * 0.4 + lift * 0.3,
          cx - spread, cy + hOff * 0.55
        );
        ctx.bezierCurveTo(
          cx - spread * 0.55, cy + hOff * 0.85 - lift * 0.25,
          cx - spread * 0.2, cy + hOff * 0.45,
          cx + swayX * 0.15, cy + hOff * 0.72
        );
        /* Sağ sayfa kanadı */
        ctx.bezierCurveTo(
          cx + spread * 0.2, cy + hOff * 0.45,
          cx + spread * 0.55, cy + hOff * 0.85 + lift * 0.25,
          cx + spread, cy + hOff * 0.55
        );
        ctx.bezierCurveTo(
          cx + spread * 0.85, cy - hOff * 0.4 - lift * 0.3,
          cx + spread * 0.45, cy - hOff + lift * 0.6,
          cx + swayX * 0.15, cy - hOff * 0.65
        );

        ctx.fillStyle = layer === 0 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.22)";
        ctx.fill();
        ctx.strokeStyle = layer === 4 ? "#C8312B" : "#111111";
        ctx.globalAlpha = layer === 4 ? 0.38 : 0.12 + p * 0.06;
        ctx.lineWidth = layer === 4 ? 1.5 : 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawButterfly(b) {
      var px = b.x * w, py = b.y * h;
      var angle = Math.atan2(b.vy, b.vx) + Math.PI * 0.5;
      var flap = 0.35 + Math.abs(Math.sin(t * b.speed + b.phase)) * 0.75;
      var s = b.size;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.globalAlpha = (b.temp ? b.life : 1) * (b.crimson ? 0.78 : 0.48);
      ctx.fillStyle = b.crimson ? "#C8312B" : "#111111";

      /* Sol & sağ kanat */
      for (var side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.scale(side * flap, 1);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.2);
        ctx.bezierCurveTo(s * 0.95, -s * 1.05, s * 1.25, -s * 0.05, 0, s * 0.25);
        ctx.bezierCurveTo(s * 0.85, s * 0.35, s * 0.65, s * 0.95, 0, s * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function frame() {
      t += 0.018;
      ptr.x += (ptr.tx - ptr.x) * 0.08;
      ptr.y += (ptr.ty - ptr.y) * 0.08;

      ctx.clearRect(0, 0, w, h);

      drawBookPages();

      /* Tıklama mürekkep halkaları */
      for (var r = ripples.length - 1; r >= 0; r--) {
        var rp = ripples[r];
        rp.r += 4.2;
        rp.alpha *= 0.95;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = "#C8312B";
        ctx.globalAlpha = rp.alpha;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (rp.alpha < 0.02) ripples.splice(r, 1);
      }

      /* İmleç mürekkep tozu izi */
      for (var tr = trail.length - 1; tr >= 0; tr--) {
        var pt = trail[tr];
        pt.alpha *= 0.92;
        pt.y -= 0.4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = "#C8312B";
        ctx.globalAlpha = pt.alpha;
        ctx.fill();
        if (pt.alpha < 0.02) trail.splice(tr, 1);
      }

      /* Kelebek fiziği */
      for (var i = butterflies.length - 1; i >= 0; i--) {
        var b = butterflies[i];
        if (ptr.active) {
          var dx = ptr.x - b.x, dy = ptr.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.04 && dist < 0.45) {
            b.vx += (dx / dist) * 0.00018;
            b.vy += (dy / dist) * 0.00018;
          }
        }
        b.vx += (Math.sin(t * 0.9 + b.phase) * 0.00008);
        b.vy += (Math.cos(t * 1.1 + b.phase) * 0.00006);
        b.vx *= 0.985;
        b.vy *= 0.985;
        b.x += b.vx;
        b.y += b.vy;

        if (!b.temp) {
          if (b.x < -0.05) b.x = 1.05;
          if (b.x > 1.05) b.x = -0.05;
          if (b.y < -0.05) b.y = 1.05;
          if (b.y > 1.05) b.y = -0.05;
        } else {
          b.life -= 0.012;
          if (b.life <= 0) { butterflies.splice(i, 1); continue; }
        }
        drawButterfly(b);
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    requestAnimationFrame(frame);
  }
})();
