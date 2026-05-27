import { cls } from "./utils"

const SOURCES = {
  mark: "/brand/fidelity-mark.svg",
  full: "/brand/fidelity_international_rgb_full.svg",
  png: "/brand/fidelity_international_rgb_wo1x.png",
}

export default function FidelityLogo({
  variant = "mark",
  className,
  alt = "Fidelity International",
}) {
  return (
    <img
      src={SOURCES[variant] ?? SOURCES.mark}
      alt={alt}
      className={cls("block object-contain", className)}
      draggable={false}
    />
  )
}
