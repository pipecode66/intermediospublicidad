const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const links = mainNav ? mainNav.querySelectorAll("a") : [];
const counters = document.querySelectorAll("[data-counter]");
const revealItems = document.querySelectorAll(".reveal, .reveal-stagger");
const year = document.getElementById("year");
const logos = document.querySelectorAll(".logo-asset");
const carousels = document.querySelectorAll("[data-carousel]");
const sliders = document.querySelectorAll("[data-slider]");
const loopingTracks = document.querySelectorAll("[data-loop-track]");
let audioUnlocked = false;

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

const unlockVideoAudio = () => {
  if (audioUnlocked) {
    return;
  }

  audioUnlocked = true;

  const activeVideo = document.querySelector(
    '[data-slider="video"] .slider-card.is-active video'
  );

  if (!activeVideo) {
    return;
  }

  activeVideo.muted = false;
  activeVideo.volume = 0.35;
  activeVideo.play().catch(() => {});
};

window.addEventListener("pointerdown", unlockVideoAudio, { once: true });
window.addEventListener("keydown", unlockVideoAudio, { once: true });

sliders.forEach((slider) => {
  const type = slider.dataset.slider || "";
  const track = slider.querySelector("[data-slider-track]");
  const prev = slider.querySelector("[data-slider-prev]");
  const next = slider.querySelector("[data-slider-next]");

  if (!track || !prev || !next) {
    return;
  }

  const cards = Array.from(track.children);
  let index = 0;
  let timerId = null;
  const interval = Number(slider.dataset.sliderInterval || "0");

  const getStep = () => {
    const card = cards[0];
    if (!card) {
      return 320;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).gap || "0");
    return card.getBoundingClientRect().width + gap;
  };

  const syncActiveVideo = () => {
    if (type !== "video") {
      return;
    }

    cards.forEach((card, cardIndex) => {
      const video = card.querySelector("video");
      if (!video) {
        return;
      }

      video.volume = 0.35;

      if (cardIndex !== index) {
        video.pause();
        video.currentTime = 0;
        return;
      }

      video.muted = false;
      const playAttempt = video.play();

      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          video.muted = !audioUnlocked;
          video.play().catch(() => {});
        });
      }
    });
  };

  const render = () => {
    const step = getStep();
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === index);
    });
    track.style.transform = `translateX(${-step * index}px)`;
    syncActiveVideo();
  };

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = () => {
    if (!interval) {
      return;
    }

    stopTimer();
    timerId = setInterval(() => {
      index = (index + 1) % cards.length;
      render();
    }, interval);
  };

  const goTo = (nextIndex) => {
    index = (nextIndex + cards.length) % cards.length;
    render();

    if (type !== "video") {
      startTimer();
    }
  };

  prev.addEventListener("click", () => {
    goTo(index - 1);
  });

  next.addEventListener("click", () => {
    goTo(index + 1);
  });

  if (type === "video") {
    cards.forEach((card, cardIndex) => {
      const video = card.querySelector("video");
      if (!video) {
        return;
      }

      video.addEventListener("ended", () => {
        if (cardIndex === index) {
          goTo(index + 1);
        }
      });
    });
  } else {
    startTimer();
    slider.addEventListener("mouseenter", stopTimer);
    slider.addEventListener("mouseleave", startTimer);
  }

  window.addEventListener("resize", render);
  render();
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
