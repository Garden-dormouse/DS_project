import React, { useMemo } from "react";

export default function MiniSparkline({ points, color = "#60A5FA" }) {
  const W = 620;
  const H = 170;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 14;
  const padBottom = 38;

  const { d, min, max, ticks, yTicks } = useMemo(() => {
    if (!points?.length) {
      return { d: "", min: 0, max: 0, ticks: [], yTicks: [] };
    }

    const vals = points.map((p) => Number(p.value || 0));
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    const scaleX = (i) => {
      if (points.length === 1) return padLeft + plotW / 2;
      return padLeft + (i * plotW) / (points.length - 1);
    };

    const scaleY = (v) => {
      if (max === min) return padTop + plotH / 2;
      const t = (v - min) / (max - min);
      return padTop + (1 - t) * plotH;
    };

    let d = "";
    points.forEach((p, i) => {
      const x = scaleX(i);
      const y = scaleY(Number(p.value || 0));
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    const tickCount = Math.min(12, points.length);
    const used = new Set();

    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const index =
        tickCount === 1
          ? 0
          : Math.round((i * (points.length - 1)) / (tickCount - 1));

      if (used.has(index)) return null;
      used.add(index);

      return {
        index,
        x: scaleX(index),
        label: points[index]?.label || "",
      };
    }).filter(Boolean);

    const yTicks = [min, (min + max) / 2, max].map((v) => ({
      value: v,
      y: scaleY(v),
    }));

    return { d, min, max, ticks, yTicks };
  }, [points]);

  if (!points?.length) {
    return <div className="note">No timeseries data.</div>;
  }

  return (
    <div style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="190"
        style={{ display: "block" }}
      >
        {/* horizontal grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              x2={W - padRight}
              y1={t.y}
              y2={t.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="rgba(255,255,255,0.45)"
            >
              {formatShortNumber(t.value)}
            </text>
          </g>
        ))}

        {/* x axis */}
        <line
          x1={padLeft}
          x2={W - padRight}
          y1={H - padBottom}
          y2={H - padBottom}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* x axis ticks */}
        {ticks.map((t) => (
          <g key={t.index}>
            <line
              x1={t.x}
              x2={t.x}
              y1={H - padBottom}
              y2={H - padBottom + 5}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
            />
            <text
              x={t.x}
              y={H - 14}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.52)"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* line */}
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>min: {formatNumber(min)}</span>
        <span>max: {formatNumber(max)}</span>
      </div>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n || 0));
}

function formatShortNumber(n) {
  const value = Number(n || 0);

  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;

  return String(Math.round(value));
}