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
  const captionTitle = slider.querySelector("[data-video-caption-title]");
  const captionDescription = slider.querySelector("[data-video-caption-description]");

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

      video.muted = !audioUnlocked;
      const playAttempt = video.play();

      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    });

    const activeCard = cards[index];
    if (activeCard && captionTitle && captionDescription) {
      captionTitle.textContent = activeCard.dataset.videoTitle || "";
      captionDescription.textContent = activeCard.dataset.videoDescription || "";
    }
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
  const shouldLoop = carousel.dataset.carouselLoop === "true";
  const interval = Number(carousel.dataset.carouselInterval || "0");

  if (!track || !prev || !next) {
    return;
  }

  const originalCards = Array.from(track.children);
  const originalCount = originalCards.length;
  let index = 0;
  let resetTimer = null;
  let autoplayTimer = null;
  let scrollSyncTimer = null;

  if (shouldLoop && track.dataset.cloned !== "true") {
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.dataset.clone = "true";
      track.appendChild(clone);
    });

    track.dataset.cloned = "true";
  }

  const getStep = () => {
    const card = track.querySelector(".carousel-card");
    if (!card) {
      return 320;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).gap || "0");
    return card.getBoundingClientRect().width + gap;
  };

  const scrollToIndex = (targetIndex, behavior = "smooth") => {
    track.scrollTo({ left: getStep() * targetIndex, behavior });
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const scheduleReset = () => {
    if (!shouldLoop) {
      return;
    }

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      track.scrollTo({ left: 0, behavior: "auto" });
      index = 0;
    }, 460);
  };

  const startAutoplay = () => {
    if (!shouldLoop || !interval) {
      return;
    }

    stopAutoplay();
    autoplayTimer = setInterval(() => {
      handleNext();
    }, interval);
  };

  const handlePrev = () => {
    clearTimeout(resetTimer);

    if (!shouldLoop) {
      track.scrollBy({ left: -getStep(), behavior: "smooth" });
      return;
    }

    index = index <= 0 ? originalCount - 1 : index - 1;
    scrollToIndex(index);
    startAutoplay();
  };

  const handleNext = () => {
    clearTimeout(resetTimer);

    if (!shouldLoop) {
      track.scrollBy({ left: getStep(), behavior: "smooth" });
      return;
    }

    index += 1;
    scrollToIndex(index);

    if (index >= originalCount) {
      scheduleReset();
    }

    startAutoplay();
  };

  prev.addEventListener("click", () => {
    handlePrev();
  });

  next.addEventListener("click", () => {
    handleNext();
  });

  if (shouldLoop) {
    track.addEventListener("scroll", () => {
      clearTimeout(scrollSyncTimer);
      scrollSyncTimer = setTimeout(() => {
        const step = getStep();
        const rawIndex = Math.round(track.scrollLeft / step);

        if (rawIndex >= originalCount) {
          track.scrollTo({ left: 0, behavior: "auto" });
          index = 0;
          return;
        }

        index = Math.max(rawIndex, 0);
      }, 120);
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    window.addEventListener("resize", () => {
      clearTimeout(resetTimer);
      scrollToIndex(index, "auto");
    });
    startAutoplay();
  }
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
