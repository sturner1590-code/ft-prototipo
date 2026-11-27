/* Fernando Turner · sitio de trayectoria (prototipo v2)
   GSAP 3 + ScrollTrigger + Lenis. Se lee completo aunque falten las librerías o se prefiera movimiento reducido. */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // ---------- Videos de fondo: solo se reproducen mientras están en pantalla ----------
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { v.preload = "auto"; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    }), { threshold: 0.15 });
    $$(".auto-video").forEach((v) => io.observe(v));
  }

  // ---------- Portada: los cuatro perfiles rotan con su fotografía ----------
  const SLIDE_MS = 4500;
  const slides = $$(".hero .slide");
  const pillars = $$(".pillar");
  let current = 0, timer = null;
  document.documentElement.style.setProperty("--slide-ms", SLIDE_MS + "ms");

  function show(i) {
    current = i;
    slides.forEach((s, k) => s.classList.toggle("is-on", k === i));
    pillars.forEach((p, k) => {
      const on = k === i;
      p.classList.remove("is-on");
      p.setAttribute("aria-selected", on);
    });
    // reinicia la barra de progreso del pilar activo
    void pillars[i].offsetWidth;
    pillars[i].classList.add("is-on");
  }
  function play() { clearInterval(timer); if (!reduce) timer = setInterval(() => show((current + 1) % pillars.length), SLIDE_MS); }
  pillars.forEach((p) => p.addEventListener("click", () => { show(+p.dataset.i); play(); }));
  show(0); play();

  // ---------- Formulario (sin backend en el prototipo) ----------
  const form = $("#form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $(".form-msg", form);
    const tel = form.tel.value.replace(/\D/g, "");
    if (!form.nombre.value.trim() || !form.municipio.value || tel.length !== 10 || !form.aviso.checked) {
      msg.className = "form-msg err";
      msg.textContent = "Revisa tu nombre, municipio, un WhatsApp de 10 dígitos y acepta el aviso de privacidad.";
      return;
    }
    msg.className = "form-msg ok";
    msg.textContent = "¡Gracias, " + form.nombre.value.trim().split(" ")[0] + "! Pronto te escribiremos.";
    form.reset();
  });

  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Desplazamiento suave ----------
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(id) : $(id).scrollIntoView();
  }));

  const marks = $$(".ticker a");
  // La línea de tiempo sigue el orden de las secciones: se marca la que está en pantalla
  function markSection(id) {
    let best = marks.find((m) => m.getAttribute("href") === "#" + id);
    if (best) marks.forEach((m) => m.classList.toggle("is-on", m === best));
  }

  // ---------- Encabezado y línea de tiempo ----------
  ScrollTrigger.create({ start: 80, end: "max", toggleClass: { targets: ".top", className: "solid" } });
  ScrollTrigger.create({ trigger: "#origen", start: "top 80%", end: "max", toggleClass: { targets: ".ticker", className: "on" } });
  gsap.to(".ticker-fill", { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#origen", start: "top center", endTrigger: "#hoy", end: "center center", scrub: 0.3 } });

  // Sección activa en la línea de tiempo
  $$(".scene[id]").forEach((sec) => {
    ScrollTrigger.create({ trigger: sec, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && markSection(sec.id) });
  });

  // ---------- Contadores ----------
  const fmt = new Intl.NumberFormat("es-MX");
  $$("[data-count]").forEach((el) => {
    const to = +el.dataset.count, plain = el.hasAttribute("data-plain");
    const from = plain ? Math.max(0, to - 60) : 0; // los años cuentan desde poco antes, no desde cero
    el.textContent = plain ? from : fmt.format(from);
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => {
        const o = { v: from };
        gsap.to(o, { v: to, duration: reduce ? 0 : 1.8, ease: "power3.out",
          onUpdate: () => (el.textContent = plain ? Math.round(o.v) : fmt.format(Math.round(o.v))) });
      }
    });
  });

  if (reduce) return;

  // ---------- Portada: entrada ----------
  gsap.from(".hero-name span", { yPercent: 100, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.1, delay: 0.1 });
  gsap.from(".hero .eyebrow, .hero-line", { y: 20, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.45 });
  gsap.from(".hero-man", { y: 80, opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.2 });
  gsap.from(".pillar", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.7 });
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  if (desktop) {
    gsap.to(".hero-man", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    // en escritorio el nombre solo se eleva al bajar; ya no se desvanece
    gsap.to(".hero-copy", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "10% top", end: "bottom top", scrub: true } });
  }

  // ---------- Parallax de los fondos (se suma al movimiento lento de cada foto) ----------
  if (window.matchMedia("(min-width: 768px)").matches) $$(".scene .bg").forEach((bg) => {
    gsap.fromTo(bg, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: bg.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // ---------- Entradas: aparecen una sola vez al entrar en pantalla y ya no se ocultan ----------
  document.documentElement.classList.add("js-reveal");
  const showEl = (el) => el.classList.add("in");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { showEl(e.target); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    $$(".reveal, .helix, .chips").forEach((el) => {
      // lo que ya quedó arriba de la pantalla (al recargar a media página) se muestra de inmediato
      if (el.getBoundingClientRect().bottom < 0) showEl(el); else io.observe(el);
    });
  } else {
    $$(".reveal, .helix, .chips").forEach(showEl);
  }
  // red de seguridad: si por algo una entrada no se disparó, se muestra en 4 s
  setTimeout(() => $$(".reveal").forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) showEl(el); }), 4000);

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
