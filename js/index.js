"use strict";

(() => {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  const sliderConfigs = [
    { selector: ".staff-intro", itemSelector: ".staff-card", interval: 4200 },
    { selector: ".room-gallery", itemSelector: ".room-card", interval: 3600 },
  ];

  const sliders = sliderConfigs
    .map((config) => {
      const element = document.querySelector(config.selector);
      if (!element) {
        return null;
      }
      return createAutoSlider(element, config, mobileQuery, reducedMotionQuery);
    })
    .filter(Boolean);

  if (!sliders.length) {
    return;
  }

  const refreshAll = () => {
    sliders.forEach((slider) => slider.refresh());
  };

  const onVisibility = () => {
    sliders.forEach((slider) => {
      if (document.hidden) {
        slider.stop();
      } else {
        slider.start();
      }
    });
  };

  window.addEventListener("resize", refreshAll, { passive: true });
  window.addEventListener("orientationchange", refreshAll);
  document.addEventListener("visibilitychange", onVisibility);

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", refreshAll);
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(refreshAll);
  }
})();

function createAutoSlider(container, config, mobileQuery, reducedMotionQuery) {
  let timerId = null;
  let resumeTimeoutId = null;
  let step = 0;
  const items = Array.from(container.querySelectorAll(config.itemSelector));
  const dots = createDots(container, items.length);

  const getGap = () => {
    const styles = window.getComputedStyle(container);
    const gapValue = styles.columnGap !== "normal" ? styles.columnGap : styles.gap;
    return Number.parseFloat(gapValue) || 0;
  };

  const getStep = () => {
    const firstItem = items[0];
    if (!firstItem) {
      return 0;
    }
    return firstItem.getBoundingClientRect().width + getGap();
  };

  const getCurrentIndex = () => {
    if (!step || !items.length) {
      return 0;
    }
    const rawIndex = Math.round(container.scrollLeft / step);
    return Math.max(0, Math.min(items.length - 1, rawIndex));
  };

  const updateDots = (activeIndex) => {
    if (!dots.length) {
      return;
    }
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const scrollToIndex = (index, behavior) => {
    if (!items.length) {
      return;
    }
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const nextLeft = step * clamped;
    container.scrollTo({ left: nextLeft, behavior });
    updateDots(clamped);
  };

  const canAutoPlay = () => {
    if (reducedMotionQuery.matches || !mobileQuery.matches) {
      return false;
    }
    return container.scrollWidth > container.clientWidth + 4;
  };

  const clearTimers = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    if (resumeTimeoutId !== null) {
      clearTimeout(resumeTimeoutId);
      resumeTimeoutId = null;
    }
  };

  const tick = () => {
    if (!canAutoPlay()) {
      return;
    }

    if (!step) {
      step = getStep();
    }
    if (!step) {
      return;
    }

    const current = getCurrentIndex();
    const next = current + 1 >= items.length ? 0 : current + 1;
    scrollToIndex(next, next === 0 ? "auto" : "smooth");
  };

  const start = () => {
    clearTimers();
    step = getStep();
    updateDots(getCurrentIndex());
    if (!canAutoPlay()) {
      return;
    }
    timerId = setInterval(tick, config.interval);
  };

  const stop = () => {
    clearTimers();
  };

  const pauseThenResume = () => {
    stop();
    if (!canAutoPlay()) {
      return;
    }
    resumeTimeoutId = setTimeout(start, 2200);
  };

  const interactionEvents = [
    "touchstart",
    "touchend",
    "pointerdown",
    "pointerup",
    "wheel",
    "mouseenter",
    "mouseleave",
    "focusin",
    "focusout",
  ];

  interactionEvents.forEach((eventName) => {
    container.addEventListener(eventName, pauseThenResume, { passive: true });
  });

  container.addEventListener(
    "scroll",
    () => {
      if (!step) {
        step = getStep();
      }
      updateDots(getCurrentIndex());
    },
    { passive: true },
  );

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      pauseThenResume();
      if (!step) {
        step = getStep();
      }
      scrollToIndex(index, "smooth");
    });
  });

  start();

  return {
    start,
    stop,
    refresh: start,
  };
}

function createDots(container, count) {
  if (count <= 1) {
    return [];
  }

  const wrap = document.createElement("div");
  wrap.className = "slider-dots";
  wrap.setAttribute("aria-label", "スライダー位置");

  const dots = [];
  for (let index = 0; index < count; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slider-dot";
    button.setAttribute("aria-label", `${index + 1}枚目を表示`);
    if (index === 0) {
      button.classList.add("is-active");
    }
    wrap.appendChild(button);
    dots.push(button);
  }

  container.insertAdjacentElement("afterend", wrap);
  return dots;
}
