import { motion } from "motion/react";
import type { CSSProperties } from "react";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  borderWidth?: number;
}

export function BorderBeam({
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  className = "",
  borderWidth = 1,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        border: `${borderWidth}px solid transparent`,
        maskImage: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        maskClip: "padding-box, border-box",
        WebkitMaskClip: "padding-box, border-box",
      }}
    >
      <motion.div
        className={`absolute aspect-square ${className}`}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
        } as CSSProperties}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
        }}
      />
    </div>
  );
}
