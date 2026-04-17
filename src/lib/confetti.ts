import confetti from "canvas-confetti";

export function celebrate() {
  const colors = ["#b85a2a", "#e8a854", "#cd7f32", "#f5c98a"];
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors });
  }, 200);
}

export function haptic() {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(30); } catch {}
  }
}
