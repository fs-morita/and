"use strict";

document.documentElement.classList.add("js");

(() => {
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#global-nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const mobileNavigation = window.matchMedia("(max-width: 920px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  setupHeaderShadow(header);
  setupMobileNavigation({
    body,
    button: menuButton,
    navigation,
    backdrop,
    mediaQuery: mobileNavigation,
  });
  setupMobileCallToAction();
  setupRevealEffects(body, reducedMotion);
})();

function setupHeaderShadow(header) {
  if (!header) {
    return;
  }

  let scheduled = false;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
    scheduled = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      window.requestAnimationFrame(update);
    },
    { passive: true },
  );

  update();
}

function setupMobileNavigation({ body, button, navigation, backdrop, mediaQuery }) {
  if (!button || !navigation || !backdrop) {
    return;
  }

  const links = Array.from(navigation.querySelectorAll("a[href]"));
  const headerPhone = document.querySelector(".header-phone");
  const backgroundElements = [
    document.querySelector("main"),
    document.querySelector(".site-footer"),
    document.querySelector(".mobile-cta"),
    document.querySelector(".header-brand"),
  ].filter(Boolean);
  let isOpen = false;

  const setBackgroundInert = (value) => {
    backgroundElements.forEach((element) => {
      element.inert = value;
    });
  };

  const syncNavigationMode = () => {
    if (!mediaQuery.matches) {
      closeMenu({ restoreFocus: false });
      navigation.removeAttribute("aria-hidden");
      navigation.inert = false;
      setBackgroundInert(false);
      return;
    }

    navigation.setAttribute("aria-hidden", String(!isOpen));
    navigation.inert = !isOpen;
  };

  const openMenu = () => {
    if (!mediaQuery.matches || isOpen) {
      return;
    }

    isOpen = true;
    body.classList.add("nav-open");
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "メニューを閉じる");
    navigation.setAttribute("aria-hidden", "false");
    navigation.inert = false;
    setBackgroundInert(true);
    backdrop.hidden = false;

    window.requestAnimationFrame(() => {
      links[0]?.focus();
    });
  };

  function closeMenu({ restoreFocus = true } = {}) {
    if (!isOpen && mediaQuery.matches) {
      navigation.setAttribute("aria-hidden", "true");
      navigation.inert = true;
      setBackgroundInert(false);
      backdrop.hidden = true;
      return;
    }

    isOpen = false;
    body.classList.remove("nav-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "メニューを開く");
    backdrop.hidden = true;
    setBackgroundInert(false);

    if (mediaQuery.matches) {
      navigation.setAttribute("aria-hidden", "true");
      navigation.inert = true;
    } else {
      navigation.removeAttribute("aria-hidden");
      navigation.inert = false;
    }

    if (restoreFocus && mediaQuery.matches) {
      button.focus();
    }
  }

  button.addEventListener("click", () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  backdrop.addEventListener("click", () => closeMenu());

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.hash ? document.querySelector(link.hash) : null;
      closeMenu({ restoreFocus: false });

      if (!target) {
        return;
      }

      target.setAttribute("tabindex", "-1");
      window.setTimeout(() => target.focus({ preventScroll: true }), 0);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = [...links, ...(headerPhone ? [headerPhone] : []), button];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", syncNavigationMode);
  } else {
    mediaQuery.addListener(syncNavigationMode);
  }

  syncNavigationMode();
}

function setupMobileCallToAction() {
  const callToAction = document.querySelector(".mobile-cta");
  const hero = document.querySelector(".hero");

  if (!callToAction || !hero) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    callToAction.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      callToAction.classList.toggle("is-visible", !entry.isIntersecting);
    },
    { threshold: 0.06 },
  );

  observer.observe(hero);
}

function setupRevealEffects(body, reducedMotion) {
  const elements = Array.from(document.querySelectorAll("[data-reveal]"));

  if (!elements.length) {
    return;
  }

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  body.classList.add("reveal-enabled");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -7% 0px",
    },
  );

  elements.forEach((element) => observer.observe(element));
}
