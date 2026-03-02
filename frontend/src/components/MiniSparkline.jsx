import React, { useMemo } from "react";

export default function MiniSparkline({ points }) {
  const { d, min, max } = useMemo(() => {
    if (!points?.length) return { d: "", min: 0, max: 0 };

    const vals = points.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    const W = 520;
    const H = 120;
    const pad = 10;

    const scaleX = (i) => {
      if (points.length === 1) return W / 2;
      return pad + (i * (W - pad * 2)) / (points.length - 1);
    };
    const scaleY = (v) => {
      if (max === min) return H / 2;
      const t = (v - min) / (max - min);
      return pad + (1 - t) * (H - pad * 2);
    };

    let d = "";
    points.forEach((p, i) => {
      const x = scaleX(i);
      const y = scaleY(p.value);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    return { d, min, max };
  }, [points]);

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox="0 0 520 120" width="100%" height="140" style={{ display: "block" }}>
        <path d={d} fill="none" stroke="rgba(96,165,250,0.9)" strokeWidth="2.5" />
        <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
        <span>min: {Math.round(min)}</span>
        <span>max: {Math.round(max)}</span>
      </div>
    </div>
  );
}
