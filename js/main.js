/* ==========================================================
   CORE FITNESS — site interactions
   ========================================================== */

// ---- Gym contact settings: edit these in one place ----
const CORE = {
  whatsapp: "265000000000", // international format, no "+" or spaces (e.g. 265991234567)
  mapsUrl: "https://maps.app.goo.gl/kBZZqsouo9vo6uV37",
};

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  /* Header state on scroll */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
    });
    document.querySelectorAll(".mobile-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", false);
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("menu-open")) toggle.click();
    });
  }

  /* Active nav link */
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a, .mobile-nav a.m-link").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });

  /* Reveal on scroll */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* Counters */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const dur = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          runCounter(en.target);
          cio.unobserve(en.target);
        }
      })
    );
    counters.forEach((c) => cio.observe(c));
  }

  /* Pricing: monthly / annual toggle */
  const billingBtns = document.querySelectorAll("[data-billing]");
  billingBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const mode = btn.dataset.billing;
      billingBtns.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", b === btn);
      });
      document.querySelectorAll(".plan[data-monthly]").forEach((plan) => {
        const m = parseInt(plan.dataset.monthly, 10);
        const amt = plan.querySelector(".amt");
        const note = plan.querySelector(".plan-note");
        if (mode === "annual") {
          const perMonth = Math.round((m * 10) / 12 / 500) * 500; // 2 months free
          amt.textContent = perMonth.toLocaleString();
          note.textContent = `Billed MWK ${(m * 10).toLocaleString()} yearly — 2 months free`;
        } else {
          amt.textContent = m.toLocaleString();
          note.textContent = plan.dataset.note || "Billed monthly · cancel anytime";
        }
      });
    })
  );

  /* Timetable: filters + highlight today */
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = document.querySelector(`.tt-day[data-day="${days[new Date().getDay()]}"]`);
  if (today) today.classList.add("today");
  document.querySelectorAll(".filter-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      const f = btn.dataset.filter;
      document.querySelectorAll(".tt-class").forEach((c) => {
        c.classList.toggle("hidden", f !== "all" && c.dataset.type !== f);
      });
    })
  );

  /* Register form */
  const reg = document.getElementById("register-form");
  if (reg) {
    const params = new URLSearchParams(location.search);
    const pre = params.get("plan");
    if (pre) {
      const radio = reg.querySelector(`input[name="plan"][value="${pre}"]`);
      if (radio) radio.checked = true;
    }

    reg.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      reg.querySelectorAll("[required]").forEach((input) => {
        const field = input.closest(".field");
        let valid = input.type === "checkbox" ? input.checked : input.value.trim() !== "";
        if (valid && input.type === "email" && input.value) valid = /^\S+@\S+\.\S+$/.test(input.value);
        if (valid && input.type === "tel") valid = input.value.replace(/\D/g, "").length >= 9;
        if (field) field.classList.toggle("error", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        const firstErr = reg.querySelector(".field.error input, .field.error select");
        if (firstErr) firstErr.focus();
        return;
      }

      const data = new FormData(reg);
      const interests = data.getAll("interests").join(", ") || "Not specified";
      const msg = [
        "Hello Core Fitness! I'd like to register.",
        "",
        `Name: ${data.get("first")} ${data.get("last")}`,
        `Phone: ${data.get("phone")}`,
        data.get("email") ? `Email: ${data.get("email")}` : null,
        `Gender: ${data.get("gender")}`,
        `Plan: ${reg.querySelector('input[name="plan"]:checked + .po b')?.textContent.replace(" ★", "") || data.get("plan")}`,
        `Goal: ${data.get("goal")}`,
        `Interests: ${interests}`,
        `Start date: ${data.get("start") || "As soon as possible"}`,
        data.get("notes") ? `Notes: ${data.get("notes")}` : null,
      ]
        .filter((l) => l !== null)
        .join("\n");

      const waLink = `https://wa.me/${CORE.whatsapp}?text=${encodeURIComponent(msg)}`;
      const success = document.querySelector(".form-success");
      const waBtn = document.getElementById("wa-confirm");
      if (waBtn) waBtn.href = waLink;
      const nameSlot = document.getElementById("success-name");
      if (nameSlot) nameSlot.textContent = data.get("first");
      reg.style.display = "none";
      if (success) {
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.open(waLink, "_blank", "noopener");
    });

    reg.querySelectorAll("input, select").forEach((el) =>
      el.addEventListener("input", () => el.closest(".field")?.classList.remove("error"))
    );
  }

  /* Contact form -> WhatsApp */
  const contact = document.getElementById("contact-form");
  if (contact) {
    contact.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(contact);
      if (!d.get("name") || !d.get("message")) {
        contact.querySelectorAll("[required]").forEach((i) => i.closest(".field").classList.toggle("error", !i.value.trim()));
        return;
      }
      const msg = `Hi Core Fitness, this is ${d.get("name")}.\nTopic: ${d.get("topic")}\n\n${d.get("message")}`;
      window.open(`https://wa.me/${CORE.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      contact.reset();
    });
  }

  /* WhatsApp links */
  document.querySelectorAll("[data-wa]").forEach((a) => {
    const text = a.dataset.wa || "Hello Core Fitness! I'd like to know more about membership.";
    a.href = `https://wa.me/${CORE.whatsapp}?text=${encodeURIComponent(text)}`;
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});
