// components/Layout/StarBackground.js
import { useEffect } from "react";

export default function StarBackground() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "-20";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let stars = [];
    let animationFrameId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 150 }, function () {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.2 + 0.2,
          speed: Math.random() * 0.5 + 0.2
        };
      });
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0ff"; // Neon cyan
      stars.forEach(function (star) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      document.body.removeChild(canvas);
    };
  }, []);

  return null; // No JSX output, only the canvas element is appended via JS
}
