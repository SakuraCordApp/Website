// The home page's scroll scenes, petals, facts row, tour and FAQ. Everything stops when the page unmounts.
export function initHome(signal) {
  const root = document.documentElement;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const on = (type, listener, options = {}) => window.addEventListener(type, listener, { ...options, signal });

  // Features: the feature nearest the middle of the screen is active, and the Mac shows its screen.
  const features = [...document.querySelectorAll("#feature-list li")];
  const screens = [...document.querySelectorAll("#feature-screens [data-screen]")];
  if (features.length && screens.length) {
    let current = -1;
    const show = (index) => {
      if (index === current) return;
      current = index;
      features.forEach((li, i) => li.classList.toggle("active", i === index));
      screens.forEach((el) => { el.style.opacity = el.dataset.screen === String(index) ? "1" : "0"; });
    };
    const pick = () => {
      const middle = innerHeight / 2;
      let best = 0, bestDistance = Infinity;
      features.forEach((li, i) => {
        const box = li.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < bestDistance) { bestDistance = distance; best = i; }
      });
      show(best);
    };
    let queued = false;
    on("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; pick(); }); } }, { passive: true });
    on("resize", pick);
    pick();
  }

  // Word scroll: the statement lights up word by word, then gives way to the app (from gazeunlock.com).
  const section = document.querySelector(".word-scroll");
  const copy = document.getElementById("ws-copy");
  const demo = document.getElementById("ws-demo");
  if (section && copy && demo && !still.matches) {
    const petals = startPetals(demo.querySelector(".petals"));
    const words = [...section.querySelectorAll(".w")];
    const lits = words.map((w) => w.querySelector(".lit"));
    const glows = words.map((w) => w.querySelector(".glo"));
    section.classList.add("ready");
    const n = words.length;
    const start = 0.1, end = 0.4, span = end - start;
    const wordSpan = n > 1 ? (span / n) * 2.4 : span;
    const starts = words.map((_, i) => (n > 1 ? start + ((span - wordSpan) * i) / (n - 1) : start));
    const clamp = (v) => Math.min(1, Math.max(0, v));
    let queued = false;
    const update = () => {
      queued = false;
      const rect = section.getBoundingClientRect();
      const progress = clamp(-rect.top / (rect.height - innerHeight || 1));
      words.forEach((w, i) => {
        const v = clamp((progress - starts[i]) / wordSpan);
        if (lits[i]) lits[i].style.opacity = v;
        w.style.transform = v === 1 ? "" : `translateY(${0.12 * (1 - v) * (1 - v) - 0.04 * Math.sin(Math.PI * v)}em)`;
        if (glows[i]) glows[i].style.opacity = clamp(1 - Math.abs(progress - (starts[i] + wordSpan + 0.02)) / 0.05);
      });
      const copyValue = 1 - clamp((progress - 0.47) / 0.08);
      copy.style.opacity = copyValue;
      copy.style.transform = `scale(${0.96 + 0.04 * copyValue})`;
      petals.progress = progress;
    };
    on("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    on("resize", update);
    update();
  }

  // Sakura petals drift across the screen, then gather into the app icon as the section scrolls on.
  function startPetals(canvas) {
    const state = { progress: 0 };
    if (!canvas) return state;
    const ctx = canvas.getContext("2d");
    const COUNT = innerWidth < 700 ? 800 : 1500;
    const SAMPLE = 46;
    let W = 0, H = 0, dpr = 1, targets = [], petals = [], running = false, visible = false, icon = null;

    const loadIcon = (dark) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = SAMPLE;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const data = g.getImageData(0, 0, SAMPLE, SAMPLE).data;
        const points = [];
        for (let y = 0; y < SAMPLE; y++) for (let x = 0; x < SAMPLE; x++) {
          const i = (y * SAMPLE + x) * 4;
          if (data[i + 3] > 200) // Pixel centres, so the petal icon lines up exactly with the real icon it hands over to.
          points.push({ x: (x + 0.5) / SAMPLE - 0.5, y: (y + 0.5) / SAMPLE - 0.5, c: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})` });
        }
        icon = img;
        resolve(points);
      };
      img.src = dark ? "/site/icon-dark.png" : "/site/icon-light.png";
    });

    const palette = ["#ffffff", "#fff0f6", "#ffd6e7", "#f9b8d3", "#f39cc0", "#e879a8"];
    const build = async () => {
      targets = await loadIcon(root.classList.contains("dark"));
      // Each petal takes a random point of the icon, so the icon fills in evenly.
      for (let i = targets.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [targets[i], targets[k]] = [targets[k], targets[i]]; }
      // One petal per point of the icon, so the shape fills in with no gaps.
      petals = Array.from({ length: Math.max(COUNT, targets.length) }, (_, i) => ({
        sx: Math.random(), sy: Math.random() * 1.2 - 0.1,
        size: 5 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.02,
        sway: Math.random() * Math.PI * 2, speed: 0.15 + Math.random() * 0.35,
        color: palette[Math.floor(Math.random() * palette.length)],
        t: targets[i % targets.length], delay: Math.random(),
      }));
    };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
    };

    const petalPath = (c, s) => {
      c.beginPath();
      c.moveTo(0, s * 0.55);
      c.bezierCurveTo(s * 0.62, s * 0.2, s * 0.5, -s * 0.5, s * 0.12, -s * 0.55);
      c.lineTo(0, -s * 0.38);
      c.lineTo(-s * 0.12, -s * 0.55);
      c.bezierCurveTo(-s * 0.5, -s * 0.5, -s * 0.62, s * 0.2, 0, s * 0.55);
      c.fill();
    };
    // Offscreen layer for the handover, where the petals get trimmed to the icon's shape.
    const layer = document.createElement("canvas");
    const layerCtx = () => {
      if (layer.width !== canvas.width || layer.height !== canvas.height) { layer.width = canvas.width; layer.height = canvas.height; }
      const c = layer.getContext("2d");
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, layer.width, layer.height);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return c;
    };

    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let start = performance.now();
    const frame = (now) => {
      if (!visible || signal.aborted) { running = false; return; }
      const time = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const iconSize = Math.min(W, H) * 0.46;
      const cx = W / 2, cy = H / 2;
      const gather = Math.min(1, Math.max(0, (state.progress - 0.48) / 0.46));
      const cell = iconSize / SAMPLE;
      // Once the petals have settled, they hand over to the real icon so it ends crisp.
      const settle = Math.min(1, Math.max(0, (gather - 0.86) / 0.12));
      // The real icon fades in underneath, and the petals on top are trimmed to its shape, so the
      // handover is a straight dissolve: no fuzzy ring, no grid.
      if (icon && settle > 0) {
        ctx.globalAlpha = settle;
        ctx.drawImage(icon, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
        ctx.globalAlpha = 1;
      }
      const g = settle > 0 ? layerCtx() : ctx;
      for (const p of petals) {
        const local = ease(Math.min(1, Math.max(0, gather * 1.35 - p.delay * 0.35)));
        // Free: drift down and sway, wrapping around the screen.
        const fy = ((p.sy + time * p.speed * 0.035) % 1.2) - 0.1;
        const fx = p.sx + Math.sin(time * 0.5 + p.sway) * 0.015;
        const x0 = fx * W, y0 = fy * H;
        const x1 = cx + p.t.x * iconSize, y1 = cy + p.t.y * iconSize;
        const x = x0 + (x1 - x0) * local, y = y0 + (y1 - y0) * local;
        // As the real icon fades in, the petals tighten to their own cell so no soft edge rings it.
        const size = p.size + (cell * 2.2 - p.size) * local;
        const rot = (p.rot + time * p.spin * 60) * (1 - local);
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        g.globalAlpha = 0.9;
        g.fillStyle = local > 0.6 ? p.t.c : p.color;
        petalPath(g, size);
        g.restore();
      }
      if (g !== ctx) {
        g.globalCompositeOperation = "destination-in";
        g.drawImage(icon, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
        g.globalCompositeOperation = "source-over";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1 - settle;
        ctx.drawImage(layer, 0, 0);
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    };
    const run = () => { if (!running && visible) { running = true; requestAnimationFrame(frame); } };

    // The canvas has no size until the section switches to its scroll layout, so size it when it does.
    const sized = new ResizeObserver(resize);
    sized.observe(canvas);
    build().then(run);
    const themed = new MutationObserver(build);
    themed.observe(root, { attributes: true, attributeFilter: ["class"] });
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run(); });
    seen.observe(canvas);
    signal.addEventListener("abort", () => { sized.disconnect(); themed.disconnect(); seen.disconnect(); });
    return state;
  }

  // Copy the Homebrew command.
  const copyButton = document.getElementById("copy-brew");
  const copyLabel = document.getElementById("copy-label");
  const command = document.getElementById("brew-command");
  if (copyButton && command) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(command.textContent.trim());
        if (copyLabel) copyLabel.textContent = "Copied";
      } catch {
        if (copyLabel) copyLabel.textContent = "Select and copy";
      }
      setTimeout(() => { if (copyLabel) copyLabel.textContent = "Copy"; }, 1800);
    });
  }

  // Facts: expandable cards plus prev/next arrows that scroll one card.
  const factsRow = document.getElementById("facts-row");
  const factCards = [...document.querySelectorAll(".fact-card")];
  for (const card of factCards) {
    const button = card.querySelector(".fact-toggle");
    if (!button) continue;
    button.addEventListener("click", () => {
      const open = card.dataset.open !== "true";
      card.dataset.open = String(open);
      button.setAttribute("aria-expanded", String(open));
    });
  }
  on("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const card of factCards) {
      if (card.dataset.open !== "true") continue;
      card.dataset.open = "false";
      card.querySelector(".fact-toggle")?.setAttribute("aria-expanded", "false");
    }
  });
  const factsPrev = document.getElementById("facts-prev");
  const factsNext = document.getElementById("facts-next");
  const factStep = () => {
    const card = factCards[0];
    if (!card || !factsRow) return 262;
    return card.getBoundingClientRect().width + 14;
  };
  const factsEnds = () => {
    if (!factsRow || !factsPrev || !factsNext) return;
    const max = factsRow.scrollWidth - factsRow.clientWidth - 4;
    factsPrev.disabled = factsRow.scrollLeft <= 4;
    factsNext.disabled = factsRow.scrollLeft >= max;
  };
  if (factsRow && factsPrev && factsNext) {
    factsPrev.addEventListener("click", () => factsRow.scrollBy({ left: -factStep(), behavior: still.matches ? "auto" : "smooth" }));
    factsNext.addEventListener("click", () => factsRow.scrollBy({ left: factStep(), behavior: still.matches ? "auto" : "smooth" }));
    factsRow.addEventListener("scroll", () => requestAnimationFrame(factsEnds), { passive: true });
    on("resize", factsEnds);
    factsEnds();
  }

  // Showcase: auto-advancing slides with dots and pause.
  const showCard = document.querySelector(".show-card");
  const viewport = document.getElementById("show-viewport");
  const dots = [...document.querySelectorAll("#show-dots button")];
  const pauseButton = document.getElementById("show-pause");
  if (showCard && viewport && dots.length) {
    const slides = [...viewport.querySelectorAll(".show-slide")];
    let current = 0, paused = still.matches, timer = 0;
    showCard.dataset.paused = String(paused);
    const setDot = (index) => {
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.setAttribute("aria-selected", String(active));
        dot.tabIndex = active ? 0 : -1;
      });
    };
    const go = (index, smooth = true) => {
      current = (index + slides.length) % slides.length;
      viewport.scrollTo({ left: current * viewport.clientWidth, behavior: smooth && !still.matches ? "smooth" : "auto" });
      const active = dots[current];
      if (active) {
        const fill = active.querySelector(".dot-fill");
        if (fill) { fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = ""; }
      }
      setDot(current);
    };
    const restart = () => {
      clearInterval(timer);
      if (paused || still.matches || slides.length < 2) return;
      timer = setInterval(() => go(current + 1), 6000);
    };
    dots.forEach((dot, i) => dot.addEventListener("click", () => { go(i); restart(); }));
    const setPaused = (value) => {
      paused = value;
      showCard.dataset.paused = String(paused);
      pauseButton?.setAttribute("aria-pressed", String(paused));
      pauseButton?.setAttribute("aria-label", paused ? "Play auto-advance" : "Pause auto-advance");
      const active = dots[current]?.querySelector(".dot-fill");
      if (active) { active.style.animation = "none"; void active.offsetWidth; active.style.animation = ""; }
      restart();
    };
    pauseButton?.addEventListener("click", () => setPaused(!paused));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) restart(); else clearInterval(timer); }, { signal });
    signal.addEventListener("abort", () => clearInterval(timer));
    let scrollEnd = 0;
    viewport.addEventListener("scroll", () => {
      clearTimeout(scrollEnd);
      scrollEnd = setTimeout(() => {
        current = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth)) % slides.length;
        setDot(current);
      }, 120);
    }, { passive: true });
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); go(current + 1); restart(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(current - 1); restart(); }
    });
    on("resize", () => viewport.scrollTo({ left: current * viewport.clientWidth, behavior: "auto" }));
    setDot(0);
    restart();
  }

  // FAQ: one answer open at a time.
  const rows = [...document.querySelectorAll(".faq-row")];
  for (const row of rows) {
    const button = row.querySelector(".faq-q");
    if (!button) continue;
    button.addEventListener("click", () => {
      const open = row.dataset.open !== "true";
      for (const other of rows) {
        other.dataset.open = "false";
        other.querySelector(".faq-q")?.setAttribute("aria-expanded", "false");
      }
      row.dataset.open = String(open);
      button.setAttribute("aria-expanded", String(open));
    });
  }
}
