"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Slide } from "./types/slideTypes";
import Typewriter from "typewriter-effect";
import { FabMenu } from "./components/FavMenu";

const delayMs = 1000;

const SLIDES = [
  {
    id: 0,
    type: "swarm" as const,
    text: (
      <Typewriter
        options={{
          strings: ["Hello to Mopawsivity"],
          autoStart: true,
          loop: true,
        }}
      />
    ),
    cats: ["/cats/cat1.png", "/cats/cat2.png", "/cats/cat3.png", "/cats/cat4.png", "/cats/cat5.png", "/cats/cat6.png"],
    layout: [
      { top: "22%", left: "18%", size: 180 },
      { top: "35%", left: "68%", size: 200 },
      { top: "64%", left: "28%", size: 160 },
      { top: "18%", left: "75%", size: 150 },
      { top: "72%", left: "58%", size: 170 },
      { top: "48%", left: "42%", size: 190 },
    ],
  },
  {
    id: 1,
    type: "single" as const,
    text: "One cat. One dream.",
    cat: "/cats/cat7.png",
  },
  {
    id: 2,
    type: "singleFlip" as const,
    text: "Floating and flipping",
    cat: "/cats/cat8.png",
  },
  {
    id: 3,
    type: "textOnly" as const,
    text: "Minimal. Clean. Purr.",
  },
  {
    id: 4,
    type: "single" as const,
    text: "Final stop before teams",
    cat: "/cats/cat9.webp",
  },
];

function getTextStyle(index: number): React.CSSProperties {
  const common: React.CSSProperties = {
    fontWeight: 900,
    letterSpacing: "-0.02em",
    textAlign: "center",
    lineHeight: 1.1,
    padding: "0 6vw",
    textShadow: "0 8px 24px rgba(0,0,0,.08)",
  };
  switch (index) {
    case 0:
      return { ...common, fontSize: "clamp(32px, 6vw, 72px)" };
    case 1:
      return {
        ...common,
        fontSize: "clamp(36px, 6vw, 80px)",
        background: "linear-gradient(90deg,#ff8bd1,#8bd1ff)",
        WebkitBackgroundClip: "text",
        color: "transparent",
      };
    case 2:
      return {
        ...common,
        fontSize: "clamp(34px, 5.5vw, 68px)",
        color: "#111",
        borderBottom: "6px solid #ffe6f2",
        display: "inline-block",
        paddingBottom: "6px",
      };
    case 3:
      return { ...common, fontSize: "clamp(40px, 7vw, 88px)", color: "#111" };
    default:
      return { ...common, fontSize: "clamp(30px, 5vw, 60px)", color: "#111" };
  }
}

export default function Home() {
  const [idx, setIdx] = useState(0);
  const isTransitioning = useRef(false);

  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((next: number) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setIdx(next);
    setTimeout(() => {
      isTransitioning.current = false;
    }, 600);
  }, []);

  const next = useCallback(() => goTo((idx + 1) % SLIDES.length), [idx, goTo]);
  const prev = useCallback(() => goTo((idx - 1 + SLIDES.length) % SLIDES.length), [idx, goTo]);

  const scheduleSwitch = useCallback(
    (dir: "next" | "prev") => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        if (dir === "next") next();
        else prev();
        pendingRef.current = null;
      }, delayMs);
    },
    [next, prev]
  );

  // wheel / touch handlers
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;

    const onWheel = (e: WheelEvent) => {
      // small threshold; we only schedule but don't switch immediately
      if (Math.abs(e.deltaY) < 8) return;
      scheduleSwitch(e.deltaY > 0 ? "next" : "prev");
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      touchEndY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      const dy = touchStartY - touchEndY;
      if (Math.abs(dy) > 40) scheduleSwitch(dy > 0 ? "next" : "prev");
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      if (pendingRef.current) clearTimeout(pendingRef.current);
    };
  }, [scheduleSwitch]);

  const slide = SLIDES[idx];

  return (
    <main>
      <AnimatePresence mode="wait">
        <motion.section key={slide.id} className="slide" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <SlideContent slide={slide} idx={idx} />
        </motion.section>
      </AnimatePresence>

      <FabMenu />
    </main>
  );
}

function SlideContent({ slide, idx }: { slide: Slide; idx: number }) {
  const textStyle = getTextStyle(idx);

  if (slide.type === "swarm") {
    // Many cats with fixed coordinates + smooth shake (in place)
    return (
      <>
        {slide.cats.slice(0, slide.layout.length).map((src: string, i: number) => {
          const box = slide.layout[i];
          return (
            <motion.div
              key={i}
              className="slide__cat"
              style={{ top: box.top, left: box.left, width: box.size }}
              // "shake" path in place (tiny x/y oscillations)
              animate={{ x: [0, 6, 0, -6, 0], y: [0, -4, 0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 6 + (i % 3), ease: "easeInOut" }}
            >
              <Image src={src} alt="cat" width={box.size} height={box.size} />
            </motion.div>
          );
        })}
        <motion.h1 className="slide__text" style={textStyle} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {slide.text}
        </motion.h1>
      </>
    );
  }

  if (slide.type === "single") {
    return (
      <>
        <motion.div className="slide__cat" initial={{ scale: 0.94, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 0.7 }}>
          <Image src={slide.cat} alt="cat" width={420} height={420} />
        </motion.div>
        <motion.h1 className="slide__text" style={textStyle} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {slide.text}
        </motion.h1>
      </>
    );
  }

  if (slide.type === "singleFlip") {
    return (
      <>
        <motion.div className="slide__cat" animate={{ rotateY: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 12 }}>
          <Image src={slide.cat} alt="cat" width={420} height={420} />
        </motion.div>
        <motion.h1 className="slide__text" style={textStyle}>
          {slide.text}
        </motion.h1>
      </>
    );
  }

  if (slide.type === "textOnly") {
    return (
      <motion.h1 className="slide__text" style={textStyle} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        {slide.text}
      </motion.h1>
    );
  }

  return null;
}
