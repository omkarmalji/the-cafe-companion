import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/** Scoped motion reveals hierarchy and state changes, respecting OS preferences. */
export function Reveal({
  children,
  className = "",
  motionKey = "",
}: {
  children: ReactNode;
  className?: string;
  motionKey?: string | number;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.from("[data-enter]", {
          y: 18,
          opacity: 0,
          duration: 0.65,
          stagger: 0.075,
          ease: "power3.out",
          clearProps: "all",
        });
        gsap.utils
          .toArray<HTMLElement>("[data-reveal]")
          .forEach((element, index) => {
            gsap.from(element, {
              y: 20,
              opacity: 0,
              duration: 0.55,
              delay: (index % 3) * 0.055,
              ease: "power2.out",
              clearProps: "all",
              scrollTrigger: { trigger: element, start: "top 96%", once: true },
            });
          });
        gsap.from("[data-photo]", {
          scale: 1.045,
          duration: 1.2,
          ease: "power2.out",
          clearProps: "all",
        });
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, [motionKey]);
  return (
    <div className={className} ref={root}>
      {children}
    </div>
  );
}
