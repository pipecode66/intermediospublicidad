const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const links = mainNav ? mainNav.querySelectorAll("a") : [];
const counters = document.querySelectorAll("[data-counter]");
const revealItems = document.querySelectorAll(".reveal, .reveal-stagger");
const year = document.getElementById("year");
const logos = document.querySelectorAll(".logo-asset");

if (year) {
  year.textContent = new Date().getFullYear();
}

logos.forEach((logo) => {
  logo.addEventListener("error", () => {
    logo.classList.add("is-hidden");

    const chip = logo.closest(".logo-chip");
    if (chip) {
      chip.classList.add("is-missing");
    }

    const fallback = logo.parentElement?.querySelector(".brand-fallback");
    if (fallback) {
      fallback.classList.add("is-visible");
    }
  });
});

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const nextState = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(nextState));
    mainNav.classList.toggle("is-open", nextState);
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    });
  });
}

const startCounter = (element) => {
  if (element.dataset.started === "true") {
    return;
  }

  element.dataset.started = "true";
  const target = Number(element.dataset.counter) || 0;
  const duration = 1200;
  const startTime = performance.now();

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * target);
    element.textContent = value.toLocaleString("es-CO");

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = target.toLocaleString("es-CO");
    }
  };

  requestAnimationFrame(step);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");

      if (entry.target.dataset.counter) {
        startCounter(entry.target);
      }

      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.2,
    rootMargin: "0px 0px -40px 0px",
  }
);

revealItems.forEach((item) => observer.observe(item));
counters.forEach((counter) => observer.observe(counter));
