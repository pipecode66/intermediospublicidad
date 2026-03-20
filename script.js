const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const links = mainNav ? mainNav.querySelectorAll("a") : [];
const counters = document.querySelectorAll("[data-counter]");
const revealItems = document.querySelectorAll(".reveal, .reveal-stagger");
const year = document.getElementById("year");
const logos = document.querySelectorAll(".logo-asset");
const carousels = document.querySelectorAll("[data-carousel]");
const loopingTracks = document.querySelectorAll("[data-loop-track]");

if (year) {
  year.textContent = new Date().getFullYear();
}

logos.forEach((logo) => {
  logo.addEventListener("error", () => {
    logo.classList.add("is-hidden");

    const fallback = logo.parentElement?.querySelector(".brand-fallback");
    if (fallback) {
      fallback.classList.add("is-visible");
    }
  });
});

loopingTracks.forEach((track) => {
  if (track.dataset.cloned === "true") {
    return;
  }

  const children = Array.from(track.children);
  children.forEach((child) => {
    const clone = child.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  track.dataset.cloned = "true";
});

carousels.forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");

  if (!track || !prev || !next) {
    return;
  }

  const getStep = () => {
    const card = track.querySelector(".carousel-card");
    if (!card) {
      return 320;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).gap || "0");
    return card.getBoundingClientRect().width + gap;
  };

  prev.addEventListener("click", () => {
    track.scrollBy({ left: -getStep(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    track.scrollBy({ left: getStep(), behavior: "smooth" });
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
