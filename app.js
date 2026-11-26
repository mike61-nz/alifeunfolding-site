(() => {
  "use strict";

  const SITE = window.SITE;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* =================================================================
     Dates
     ================================================================= */
  function parseDate(s) {
    const [y, m, d] = String(s).split("-").map(Number);
    const month = m ? m - 1 : 0;
    const day = d ? d - 1 : 0;
    // fractional year; undated months/days sit in the middle-ish of their span
    const frac = m ? (month + (d ? day / 31 : 0.5)) / 12 : 0.5;
    return { year: y, t: y + frac };
  }
  function dateText(e) { return e.dateLabel || formatDate(e.date); }
  function formatDate(s) {
    const [y, m, d] = String(s).split("-").map(Number);
    if (d) return `${d} ${MONTHS[m - 1]} ${y}`;
    if (m) return `${MONTHS[m - 1]} ${y}`;
    return String(y);
  }

  /* =================================================================
     Ambient: blurry waving vegetation
     ================================================================= */
  const veg = (() => {
    const canvas = $("#veg");
    const ctx = canvas.getContext("2d");
    const SCALE = 0.35; // low-res render; the blur hides it and it's cheap
    let w = 0, h = 0, fronds = [], orbs = [];

    function build() {
      w = canvas.width = Math.ceil(innerWidth * SCALE) + 30;
      h = canvas.height = Math.ceil(innerHeight * SCALE) + 30;
      fronds = [];
      const layers = [
        { n: 40, hue: [95, 140], light: [14, 22], hMin: 0.55, hMax: 1.0, width: 0.018, amp: 0.05 },
        { n: 55, hue: [80, 130], light: [22, 34], hMin: 0.35, hMax: 0.8, width: 0.014, amp: 0.08 },
        { n: 45, hue: [60, 110], light: [32, 48], hMin: 0.2, hMax: 0.55, width: 0.012, amp: 0.12 },
      ];
      layers.forEach((L, depth) => {
        for (let i = 0; i < L.n; i++) {
          fronds.push({
            depth,
            x: Math.random() * (w + 40) - 20,
            hgt: h * (L.hMin + Math.random() * (L.hMax - L.hMin)),
            lean: (Math.random() - 0.5) * 0.5,
            wid: w * L.width * (0.6 + Math.random()),
            amp: L.amp * (0.6 + Math.random() * 0.8),
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5,
            color: `hsl(${L.hue[0] + Math.random() * (L.hue[1] - L.hue[0])} ${35 + Math.random() * 25}% ${L.light[0] + Math.random() * (L.light[1] - L.light[0])}%)`,
          });
        }
      });
      orbs = Array.from({ length: 14 }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.7,
        r: h * (0.04 + Math.random() * 0.1),
        a: 0.08 + Math.random() * 0.18,
        dx: (Math.random() - 0.5) * 0.08, ph: Math.random() * 6,
      }));
    }

    function draw(time) {
      const t = time / 1000 * (reducedMotion ? 0.25 : 1);
      // sky / light
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#c9cf9c");
      g.addColorStop(0.45, "#6f8a5a");
      g.addColorStop(1, "#1a2a1c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // drifting light (bokeh)
      for (const o of orbs) {
        o.x = (o.x + o.dx + w) % w;
        const rg = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        const a = o.a * (0.7 + 0.3 * Math.sin(t * 0.6 + o.ph));
        rg.addColorStop(0, `rgba(255,240,190,${a})`);
        rg.addColorStop(1, "rgba(255,240,190,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      }

      // wind: slow swell plus gusts that travel across the field
      const swell = Math.sin(t * 0.35) * 0.6 + Math.sin(t * 0.13) * 0.4;
      for (const f of fronds) {
        const gust = Math.sin(t * 0.9 - f.x / w * 4) * 0.5 + 0.5;
        const sway = (Math.sin(t * f.speed + f.phase) * 0.6 + swell * 0.8 + gust * 0.7) * f.amp;
        const bx = f.x, by = h + 4;
        const tipX = bx + (f.lean + sway) * f.hgt;
        const tipY = by - f.hgt * (1 - Math.abs(sway) * 0.25);
        const cx = bx + (f.lean * 0.3 + sway * 0.45) * f.hgt;
        const cy = by - f.hgt * 0.55;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(bx - f.wid, by);
        ctx.quadraticCurveTo(cx - f.wid * 0.6, cy, tipX, tipY);
        ctx.quadraticCurveTo(cx + f.wid * 0.6, cy, bx + f.wid, by);
        ctx.closePath();
        ctx.fill();
      }
      // low mist
      const mist = ctx.createLinearGradient(0, h * 0.6, 0, h);
      mist.addColorStop(0, "rgba(12,18,15,0)");
      mist.addColorStop(1, "rgba(12,18,15,.55)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, w, h);
    }

    let running = false;
    function loop(time) {
      if (!running) return;
      draw(time);
      requestAnimationFrame(loop);
    }
    addEventListener("resize", build);
    build();
    return {
      start() { if (!running) { running = true; requestAnimationFrame(loop); } },
      stop() { running = false; },
    };
  })();

  /* =================================================================
     Intro
     ================================================================= */
  function setupIntro() {
    const intro = SITE.intro || {};
    document.title = SITE.title;
    $("#siteTitle").textContent = SITE.title;
    $("#siteSubtitle").textContent = SITE.subtitle || "";
    $("#enterBtn").textContent = intro.invite || "Enter";
    $("#introHint").textContent = intro.hint || "Best viewed in landscape on a tablet or larger";

    if (intro.video) {
      const v = $("#introVideo");
      v.src = intro.video;
      v.hidden = false;
      v.style.filter = `blur(${intro.blur ?? 18}px)`;
      $("#veg").hidden = true;
      v.play().catch(() => {});
    } else {
      veg.start();
    }

    $("#enterBtn").addEventListener("click", enter, { once: true });
  }

  function enter() {
    $("#intro").classList.add("leaving");
    $("#app").hidden = false;
    void $("#app").offsetWidth; // let the fade-in transition start from 0
    document.body.classList.add("in-app");
    setTimeout(() => ($("#intro").hidden = true), 1600);
    checkOrientation();
    layout();
    setTimeout(play, 1400);
  }

  /* =================================================================
     Timeline data & layout
     ================================================================= */
  const PX_PER_YEAR = 120;
  const MIN_GAP = 22;
  // entries written in content.js + those generated from the media/ folder
  const allEntries = [...(SITE.entries || []), ...(window.MEDIA_ENTRIES || [])];
  if (!allEntries.length) allEntries.push({ date: String(new Date().getFullYear()), lane: "life", type: "note",
    title: "Nothing here yet", text: "Add photos, videos and notes to the media folder." });
  const entries = allEntries
    .map((e, i) => ({ ...e, ...parseDate(e.date), i }))
    .sort((a, b) => a.t - b.t);
  entries.forEach((e, i) => (e.i = i));

  const laneKeys = Object.keys(SITE.lanes);
  const firstYear = Math.floor(entries[0].t) - 1;
  const lastYear = Math.ceil(entries[entries.length - 1].t) + 1;
  const xOf = (t) => (t - firstYear) * PX_PER_YEAR;
  const trackWidth = xOf(lastYear);

  // nudge markers apart if they'd overlap (anywhere on the line, since autoplay visits them in order)
  let prevX = -Infinity;
  for (const e of entries) {
    e.x = Math.max(xOf(e.t), prevX + MIN_GAP);
    prevX = e.x;
  }

  const track = $("#track");
  const viewport = $("#viewport");
  const markers = [];

  function buildTrack() {
    track.style.width = `${trackWidth}px`;
    laneKeys.forEach((k, li) => {
      const line = el("div", "lane-line");
      line.style.top = laneY(li);
      track.append(line);
    });
    for (let y = firstYear; y <= lastYear; y++) {
      const tk = el("div", "tick" + (y % 10 === 0 ? " decade" : ""));
      tk.style.left = `${xOf(y)}px`;
      if (y % 10 === 0 || y % 5 === 0) tk.append(el("span", null, y));
      track.append(tk);
    }
    for (const e of entries) {
      const lane = SITE.lanes[e.lane] || { color: "#fff", label: e.lane };
      const li = Math.max(0, laneKeys.indexOf(e.lane));
      const m = el("button", `marker lane-${li}`);
      // focusing an off-screen marker must not scroll the clipped track
      m.addEventListener("focus", () => { viewport.scrollLeft = 0; });
      m.dataset.type = e.type;
      m.style.left = `${e.x}px`;
      m.style.top = laneY(li);
      m.style.setProperty("--c", lane.color);
      m.setAttribute("aria-label", `${dateText(e)}: ${e.title || e.type}`);
      m.append(el("i"), el("span", "label", `${dateText(e)} · ${e.title || ""}`));
      m.addEventListener("click", (ev) => {
        if (dragMoved) return;
        ev.stopPropagation();
        goTo(e.i, { keepPlaying: playing });
      });
      track.append(m);
      markers.push(m);
    }
    const legend = $("#legend");
    for (const k of laneKeys) {
      const s = el("span");
      const dot = el("i");
      dot.style.background = SITE.lanes[k].color;
      s.append(dot, SITE.lanes[k].label);
      legend.append(s);
    }
  }
  function laneY(i) {
    // lanes spread through the upper ~70% of the viewport, year labels below
    return `${18 + i * (52 / Math.max(1, laneKeys.length - 1))}%`;
  }

  /* =================================================================
     Playback state
     ================================================================= */
  let pos = entries[0].x - 260;  // track x under the playhead
  let vw = 0;
  let playing = false;
  let current = -1;              // index of entry on stage
  let tween = null;              // {from, to, start, dur, done}
  let dwell = null;              // {start, dur, remaining, video, finished}
  let velocity = 0;              // inertia after drag / wheel
  let settleTimer = null;

  function layout() { vw = viewport.clientWidth; }
  addEventListener("resize", () => { layout(); checkOrientation(); });

  function setPlaying(p) {
    playing = p;
    document.body.classList.toggle("playing", p);
    $("#playBtn").setAttribute("aria-label", p ? "Pause" : "Play");
    if (p && dwell && dwell.paused) {
      dwell.start = performance.now() - dwell.elapsed;
      dwell.paused = false;
    }
    if (!p && dwell && !dwell.paused) {
      dwell.elapsed = performance.now() - dwell.start;
      dwell.paused = true;
    }
  }

  function play() {
    setPlaying(true);
    velocity = 0;
    // resume a half-finished stop if we're still parked on it
    if (dwell && !dwell.finished && current >= 0 && Math.abs(pos - entries[current].x) < 2) {
      if (dwell.video && dwell.video.paused) dwell.video.play().catch(() => {});
      return;
    }
    advance();
  }
  function pause() { setPlaying(false); }
  function togglePlay() { playing ? pause() : play(); }

  function advance() {
    let next = entries.findIndex((e) => e.x > pos + 1);
    if (next === -1) {
      // reached the end: sweep back to the beginning and carry on
      if (playing) next = 0;
      else return;
    }
    goTo(next, { keepPlaying: true, glide: true });
  }

  function goTo(i, { keepPlaying = false, glide = false } = {}) {
    if (!keepPlaying) setPlaying(false);
    i = clamp(i, 0, entries.length - 1);
    velocity = 0;
    clearTimeout(settleTimer);
    const to = entries[i].x;
    const dist = Math.abs(to - pos);
    // autoplay glides; a jump the visitor asked for is quicker
    const base = glide ? (SITE.travelSeconds ?? 2.2) * 1000 : 800;
    const dur = dist < 1 ? 0 : clamp(base * Math.sqrt(dist / 300), 500, base * 1.6);
    endDwell();
    tween = { from: pos, to, start: performance.now(), dur, done: () => show(i, true) };
  }

  function step(dir) {
    const ref = current >= 0 && Math.abs(entries[current].x - pos) < 2 ? current : null;
    let i;
    if (ref != null) i = ref + dir;
    else if (dir > 0) i = entries.findIndex((e) => e.x > pos + 1);
    else i = entries.map((e) => e.x < pos - 1).lastIndexOf(true);
    if (i < 0 || i >= entries.length) return;
    goTo(i, { keepPlaying: playing });
  }

  /* =================================================================
     Stage
     ================================================================= */
  const stage = $("#stageInner");

  function show(i, startDwell) {
    const e = entries[i];
    if (current !== i) {
      current = i;
      markers.forEach((m, k) => m.classList.toggle("active", k === i));
      renderCard(e);
    }
    if (startDwell) beginDwell(e);
  }

  function renderCard(e) {
    const old = stage.querySelector(".card:not(.out)");
    if (old) {
      old.classList.add("out");
      old.querySelectorAll("video").forEach((v) => v.pause());
      setTimeout(() => old.remove(), 500);
    }
    const lane = SITE.lanes[e.lane] || { color: "#fff", label: e.lane };
    const card = el("article", "card");
    card.style.gridArea = "1 / 1";

    const meta = el("div", "meta");
    const dot = el("i", "dot");
    dot.style.background = lane.color;
    meta.append(dot, el("span", null, dateText(e)), el("span", null, "·"), el("span", null, lane.label));

    const paragraphs = (txt) =>
      String(txt || "").split(/\n\s*\n/).filter(Boolean).map((p) => el("p", null, p.trim()));

    $("#ambientPhoto").classList.remove("on");
    activeGallery = null;

    if (e.type === "note") {
      const note = el("div", "note");
      if (e.title) note.append(el("h2", null, e.title));
      note.append(...paragraphs(e.text));
      card.append(meta, note);
    } else {
      const media = el("div", "media");
      const node = mediaNode(e);
      if (node) media.append(node);
      card.append(meta);
      if (e.title) card.append(el("h2", null, e.title));
      card.append(media);
      if (e.text) card.append(el("p", "caption", e.text));
      if (e.type === "gallery" && activeGallery) card.append(activeGallery.nav);
      if (e.type === "photo" && e.src) setAmbient(e.src);
    }
    stage.append(card);
  }

  function setAmbient(src) {
    const ambient = $("#ambientPhoto");
    ambient.style.backgroundImage = `url("${src}")`;
    ambient.classList.add("on");
  }

  /* ---- gallery: a dated folder plays as a slideshow ---- */
  let activeGallery = null;
  function makeGallery(e) {
    const items = e.items || [];
    const n = items.length;
    const per = (SITE.galleryPhotoSeconds ?? 4) * 1000;
    const box = el("div", "gallery");
    const nav = el("div", "gnav");
    const prev = el("button", null, "‹"), next = el("button", null, "›"), count = el("span");
    prev.setAttribute("aria-label", "Previous picture");
    next.setAttribute("aria-label", "Next picture");
    if (n > 1) nav.append(prev, count, next);
    let idx = -1, cur = null, slideStart = 0, finishing = false;

    function showSlide(k) {
      idx = (k + n) % n;
      const it = items[idx];
      const node = el(it.type === "video" ? "video" : "img", "slide");
      node.src = it.src;
      if (it.type === "video") {
        Object.assign(node, { playsInline: true, controls: true, autoplay: true });
        node.play?.().catch(() => { node.muted = true; node.play().catch(() => {}); });
        node.addEventListener("ended", () => { if (cur === node) advanceSlide(); });
        node.addEventListener("error", () => { if (cur === node) advanceSlide(); });
      } else {
        node.alt = e.title || "";
        setAmbient(it.src);
      }
      const old = cur;
      cur = node;
      box.append(node);
      requestAnimationFrame(() => node.classList.add("on"));
      if (old) {
        old.classList.remove("on");
        if (old.pause) old.pause();
        setTimeout(() => old.remove(), 1100);
      }
      // warm up the next picture
      const nx = items[(idx + 1) % n];
      if (nx && nx.type !== "video") new Image().src = nx.src;
      count.textContent = `${idx + 1} / ${n}`;
      slideStart = performance.now();
    }
    function advanceSlide() {
      // during auto-play the last picture hands back to the timeline; otherwise loop
      if (idx === n - 1 && playing && dwell && dwell.gallery === api) { finishing = true; finishDwell(); return; }
      if (n > 1) showSlide(idx + 1);
      else slideStart = performance.now();
    }
    prev.addEventListener("click", () => showSlide(idx - 1));
    next.addEventListener("click", () => showSlide(idx + 1));

    const api = {
      box, nav,
      restart() {
        finishing = false;
        if (idx !== 0) showSlide(0);
        else slideStart = performance.now();
      },
      tick(now) {
        if (finishing || !cur || cur.tagName === "VIDEO") return;
        if (now - slideStart >= per) advanceSlide();
      },
      progress() {
        let f = 0;
        if (cur && cur.tagName === "VIDEO") f = cur.duration ? cur.currentTime / cur.duration : 0;
        else f = clamp((performance.now() - slideStart) / per, 0, 1);
        return (idx + f) / n;
      },
    };
    activeGallery = api;
    showSlide(0);
    return box;
  }

  function isVideoFile(src) { return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(src || ""); }

  function mediaNode(e) {
    if (e.type === "gallery") return makeGallery(e);
    if (e.type === "photo") {
      const img = el("img");
      img.src = e.src;
      img.alt = e.title || "";
      return img;
    }
    if (e.type === "video" || (e.type === "animation" && isVideoFile(e.src))) {
      const v = el("video");
      v.src = e.src;
      if (e.poster) v.poster = e.poster;
      v.playsInline = true;
      v.controls = e.type === "video";
      v.muted = e.type === "animation";
      v.autoplay = true;
      v.preload = "auto";
      // browsers may refuse sound without a recent tap: fall back to muted
      v.play?.().catch(() => { v.muted = true; v.play().catch(() => {}); });
      return v;
    }
    if (e.type === "animation" && e.src) {
      const img = el("img"); // gif / animated svg / webp
      img.src = e.src;
      img.alt = e.title || "";
      return img;
    }
    if (e.type === "animation") return builtinAnimation(e.animation);
    return null;
  }

  /* ---- dwell: how long autoplay lingers on an entry ---- */
  function beginDwell(e) {
    const video = stage.querySelector(".card:not(.out) video");
    let dur;
    if (e.duration) dur = e.duration * 1000;
    else if (e.type === "note") {
      const words = `${e.title || ""} ${e.text || ""}`.split(/\s+/).length;
      dur = clamp(words * 280, 4000, 14000);
    } else if (e.type === "photo") dur = 5500;
    else dur = 6000;

    dwell = { start: performance.now(), dur, video: null, finished: false, paused: !playing, elapsed: 0 };
    if (e.type === "gallery" && activeGallery) {
      dwell.gallery = activeGallery;
      activeGallery.restart();
      return;
    }
    if (video && !e.duration) {
      dwell.video = video;
      video.currentTime = 0;
      video.play().catch(() => {});
      video.addEventListener("ended", () => {
        if (dwell && dwell.video === video) finishDwell();
      }, { once: true });
      // if the file is missing, don't get stuck
      video.addEventListener("error", () => { if (dwell && dwell.video === video) dwell.video = null; }, { once: true });
    }
  }
  function endDwell() { dwell = null; $("#dwellBar").style.width = "0"; }
  function finishDwell() {
    if (!dwell) return;
    dwell.finished = true;
    $("#dwellBar").style.width = "0";
    if (playing) advance();
  }

  /* ---- built-in placeholder animations ---- */
  function builtinAnimation(name) {
    const c = el("canvas");
    c.width = 960; c.height = 540;
    const ctx = c.getContext("2d");
    const t0 = performance.now();
    const draws = {
      ripples(t) {
        ctx.fillStyle = "rgba(14,24,30,.25)";
        ctx.fillRect(0, 0, 960, 540);
        for (let k = 0; k < 6; k++) {
          const r = ((t * 70 + k * 90) % 540);
          ctx.strokeStyle = `hsla(${190 + k * 12},60%,70%,${1 - r / 540})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(480, 270, r * 1.4, r * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      },
      drift(t) {
        ctx.fillStyle = "rgba(30,16,24,.18)";
        ctx.fillRect(0, 0, 960, 540);
        for (let k = 0; k < 40; k++) {
          const x = (k * 97 + t * (20 + (k % 7) * 9)) % 1000 - 20;
          const y = 270 + Math.sin(t * 0.8 + k) * (80 + (k % 5) * 30);
          ctx.fillStyle = `hsla(${10 + k * 4},70%,${55 + (k % 3) * 10}%,.8)`;
          ctx.beginPath();
          ctx.arc(x, y, 4 + (k % 4) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    };
    const fn = draws[name] || draws.ripples;
    (function frame(now) {
      if (!c.isConnected && now - t0 > 1000) return; // card removed
      fn((now - t0) / 1000);
      requestAnimationFrame(frame);
    })(t0);
    return c;
  }

  /* =================================================================
     Manual control: drag, wheel, keys
     ================================================================= */
  let dragging = false, dragMoved = false, lastX = 0, lastT = 0;

  function manualTouch() {
    if (playing) pause();
    tween = null;
    clearTimeout(settleTimer);
  }

  viewport.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    dragging = true; dragMoved = false;
    lastX = ev.clientX; lastT = performance.now();
    velocity = 0;
    viewport.classList.add("dragging");
  });
  addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - lastX;
    if (!dragMoved && Math.abs(dx) < 4) return;
    if (!dragMoved) { dragMoved = true; manualTouch(); viewport.setPointerCapture?.(ev.pointerId); }
    const now = performance.now();
    pos -= dx;
    velocity = -dx / Math.max(1, now - lastT) * 16;
    lastX = ev.clientX; lastT = now;
  });
  addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("dragging");
    if (dragMoved) scheduleSettle();
    setTimeout(() => (dragMoved = false), 0);
  });

  viewport.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    manualTouch();
    const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
    pos += d * (ev.deltaMode === 1 ? 30 : 1);
    velocity = 0;
    scheduleSettle();
  }, { passive: false });

  // clicking empty track jumps there
  viewport.addEventListener("click", (ev) => {
    if (dragMoved || ev.target.closest(".marker")) return;
    const r = viewport.getBoundingClientRect();
    manualTouch();
    const target = pos + (ev.clientX - r.left - vw / 2);
    tween = { from: pos, to: target, start: performance.now(), dur: 600, done: scheduleSettle };
  });

  addEventListener("keydown", (ev) => {
    if (!document.body.classList.contains("in-app")) return;
    if (ev.code === "Space") { ev.preventDefault(); togglePlay(); }
    else if (ev.key === "ArrowRight") { ev.preventDefault(); step(1); }
    else if (ev.key === "ArrowLeft") { ev.preventDefault(); step(-1); }
  });
  $("#playBtn").addEventListener("click", togglePlay);
  $("#nextBtn").addEventListener("click", () => step(1));
  $("#prevBtn").addEventListener("click", () => step(-1));

  // When the user stops scrubbing, ease onto the nearest entry if one is close.
  function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (Math.abs(velocity) > 0.5 || dragging) return scheduleSettle();
      let best = -1, bestD = 90;
      entries.forEach((e, k) => { const d = Math.abs(e.x - pos); if (d < bestD) { bestD = d; best = k; } });
      if (best >= 0) {
        tween = { from: pos, to: entries[best].x, start: performance.now(), dur: 450, done: () => show(best, false) };
      }
    }, 220);
  }

  /* =================================================================
     Main loop
     ================================================================= */
  function frame(now) {
    if (tween) {
      const p = tween.dur ? clamp((now - tween.start) / tween.dur, 0, 1) : 1;
      pos = tween.from + (tween.to - tween.from) * ease(p);
      if (p >= 1) { const done = tween.done; tween = null; done && done(); }
    } else if (!dragging && Math.abs(velocity) > 0.05) {
      pos += velocity;
      velocity *= 0.93;
    }
    pos = clamp(pos, -vw / 2 + 40, trackWidth + vw / 2 - 40);

    track.style.transform = `translate3d(${vw / 2 - pos}px,0,0)`;
    $("#playheadYear").textContent = Math.floor(firstYear + pos / PX_PER_YEAR);

    if (activeGallery) activeGallery.tick(now);
    if (dwell && !dwell.finished) {
      let p;
      if (dwell.gallery) {
        p = dwell.gallery.progress();
      } else if (dwell.video && dwell.video.duration) {
        p = dwell.video.currentTime / dwell.video.duration;
      } else if (!dwell.video) {
        const elapsed = dwell.paused ? dwell.elapsed : now - dwell.start;
        p = elapsed / dwell.dur;
        if (p >= 1 && playing) finishDwell();
      }
      if (dwell && p != null) $("#dwellBar").style.width = `${clamp(p, 0, 1) * 100}%`;
    }
    requestAnimationFrame(frame);
  }

  /* =================================================================
     Orientation hint
     ================================================================= */
  function checkOrientation() {
    const small = Math.min(innerWidth, innerHeight) < 700;
    const portrait = innerHeight > innerWidth;
    $("#rotateNote").hidden = !(document.body.classList.contains("in-app") && portrait && small);
  }
  setTimeout(checkOrientation, 2000);

  /* ================================================================= */
  buildTrack();
  setupIntro();
  layout();
  stage.append(Object.assign(el("div", "card welcome"), {
    innerHTML: "Press <em>play</em>, or drag the timeline to wander.",
  }));
  requestAnimationFrame(frame);
})();
