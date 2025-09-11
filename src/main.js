import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", function () {
  console.clear();

  // ——— Loader fullscreen hitam + teks "wait" (styling via GSAP) ———
  function createLoader(text) {
    gsap.set("body", {
      overflow: "hidden",
    });
    const overlay = document.createElement("div");
    overlay.id = "preloader-overlay";
    overlay.setAttribute("aria-busy", "true");
    overlay.setAttribute("role", "status");
    overlay.textContent = text;
    document.body.appendChild(overlay);

    gsap.set(overlay, {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "#0c0c0c",
      color: "#fff",
      display: "grid",
      placeItems: "center",
      fontFamily: "var(--font-HG)",
      fontWeight: "bold",
      fontSize: "clamp(20px,4vw,28px)",
      letterSpacing: "0.1em",
      textTransform: "capitalize",
      zIndex: 2147483647,
      opacity: 1,
      pointerEvents: "none",
      userSelect: "none",
    });

    return overlay;
  }

  function hideLoader(el) {
    if (!el) return;
    gsap.to(el, {
      opacity: 0,
      duration: 0.35,
      ease: "power2.out",
      onComplete: () => el.remove(),
    });
    gsap.to("body", {
      overflow: "auto",
    });
  }

  const loaderEl = createLoader("ksabar");
  const failSafe = setTimeout(() => hideLoader(loaderEl), 10000); // jaga-jaga max 10 detik

  // ——— Smooth scroll (Lenis) ———
  const lenis = new Lenis();
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  lenis.on("scroll", ScrollTrigger.update);

  // Animasi smooth untuk text-container
  gsap.to("#text-container", {
    scale: 0.5,
    autoAlpha: 0,
    ease: "power2.inOut",
    scrollTrigger: {
      trigger: "#text-container",
      start: "top top", // mulai saat atas elemen ketemu atas viewport
      end: "bottom top", // selesai saat bawah elemen keluar viewport
      scrub: 0.5, // delay kecil biar halus
    },
  });

  const video = document.getElementById("vpos");
  if (!video) {
    clearTimeout(failSafe);
    hideLoader(loaderEl);
    return;
  }

  video.classList.add("video-background");
  let src = video.currentSrc || video.src;

  // once helper (event sekali pakai)
  const once = (el, event, fn, opts) => {
    const onceFn = (e) => {
      el.removeEventListener(event, onceFn);
      fn.apply(el, arguments);
    };
    el.addEventListener(event, onceFn, opts);
    return onceFn;
  };

  // iOS unlock
  const unlock = () => {
    video.play();
    video.pause();
  };
  once(document.documentElement, "touchstart", unlock);

  const willReplaceSrcWithBlob = !!window.fetch;

  // state kesiapan untuk menutup loader
  let isMetadataReady = false;
  let isSeekedAfterBlob = !willReplaceSrcWithBlob;

  function done() {
    if (isMetadataReady && isSeekedAfterBlob) {
      clearTimeout(failSafe);
      hideLoader(loaderEl);
    }
  }

  // Setup timeline GSAP ketika metadata siap
  once(video, "loadedmetadata", () => {
    isMetadataReady = true;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".video-wrapper",
        start: "top top",
        end: `+=${video.duration * 300}`,
        scrub: true,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(
      video,
      { currentTime: video.duration, ease: "none" },
      { currentTime: 0, ease: "none" }
    );

    ScrollTrigger.refresh();
    done();
  });

  ScrollTrigger.refresh();

  // Ganti src ke blob untuk scrubbing yang lebih stabil (opsional)
  setTimeout(() => {
    if (!willReplaceSrcWithBlob) {
      done();
      return;
    }

    fetch(src)
      .then((response) => response.blob())
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);
        const t = video.currentTime;

        once(document.documentElement, "touchstart", unlock);

        // Tunggu sampai seek selesai setelah ganti blob
        once(video, "seeked", () => {
          isSeekedAfterBlob = true;
          ScrollTrigger.refresh();
          done();
        });

        video.setAttribute("src", blobURL);
        try {
          video.currentTime = Math.max(0, t + 0.01);
        } catch (e) {
          once(video, "canplay", () => {
            isSeekedAfterBlob = true;
            done();
          });
        }
      })
      .catch(() => {
        isSeekedAfterBlob = true;
        done();
      });
  }, 1000);
});
