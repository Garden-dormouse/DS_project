import React, { useMemo } from "react";

export default function MiniSparkline({ points, color = "#60A5FA" }) {
  const {
    d,
    min,
    max,
    firstLabel,
    lastLabel,
    axisLeft,
    axisBottom,
    horizontalGuides,
    verticalGuides,
    xTicks,
    yTicks,
  } = useMemo(() => {
    if (!points?.length) {
      return {
        d: "",
        min: 0,
        max: 0,
        firstLabel: "",
        lastLabel: "",
        axisLeft: 44,
        axisBottom: 142,
        horizontalGuides: [],
        verticalGuides: [],
        xTicks: [],
        yTicks: [],
      };
    }

    const vals = points.map((p) => Number(p.value) || 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    const W = 520;
    const H = 160;

    const axisLeft = 44;
    const axisRight = 12;
    const axisTop = 10;
    const axisBottom = 142;

    const plotW = W - axisLeft - axisRight;
    const plotH = axisBottom - axisTop;

    const scaleX = (i) => {
      if (points.length === 1) return axisLeft + plotW / 2;
      return axisLeft + (i * plotW) / (points.length - 1);
    };

    const scaleY = (v) => {
      if (max === min) return axisTop + plotH / 2;
      const t = (v - min) / (max - min);
      return axisTop + (1 - t) * plotH;
    };

    let d = "";
    points.forEach((p, i) => {
      const x = scaleX(i);
      const y = scaleY(Number(p.value) || 0);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    const yTickValues =
      max === min
        ? [min]
        : [max, min + (max - min) * 0.5, min];

    const yTicks = yTickValues.map((value) => ({
      value,
      y: scaleY(value),
    }));

    const horizontalGuides = yTicks.map((tick) => ({
      y: tick.y,
    }));

    const xTicks = [];
    if (points.length === 1) {
      xTicks.push({
        x: scaleX(0),
        label: points[0]?.label || "",
      });
    } else {
      xTicks.push({
        x: scaleX(0),
        label: points[0]?.label || "",
      });
      xTicks.push({
        x: scaleX(points.length - 1),
        label: points[points.length - 1]?.label || "",
      });
    }

    const verticalGuides = xTicks.map((tick) => ({
      x: tick.x,
    }));

    return {
      d,
      min,
      max,
      firstLabel: points[0]?.label || "",
      lastLabel: points[points.length - 1]?.label || "",
      axisLeft,
      axisBottom,
      horizontalGuides,
      verticalGuides,
      xTicks,
      yTicks,
    };
  }, [points]);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>X: Month</span>
        <span>Y: Pageviews</span>
      </div>

      <svg
        viewBox="0 0 520 160"
        width="100%"
        height="180"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* horizontal guide lines */}
        {horizontalGuides.map((line, idx) => (
          <line
            key={`h-${idx}`}
            x1={44}
            y1={line.y}
            x2={508}
            y2={line.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* vertical guide lines */}
        {verticalGuides.map((line, idx) => (
          <line
            key={`v-${idx}`}
            x1={line.x}
            y1={10}
            x2={line.x}
            y2={142}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* axes */}
        <line
          x1={44}
          y1={10}
          x2={44}
          y2={142}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
        />
        <line
          x1={44}
          y1={142}
          x2={508}
          y2={142}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
        />

        {/* y tick labels */}
        {yTicks.map((tick, idx) => (
          <g key={`yt-${idx}`}>
            <line
              x1={40}
              y1={tick.y}
              x2={44}
              y2={tick.y}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
            />
            <text
              x={36}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="rgba(255,255,255,0.65)"
            >
              {formatCompactNumber(tick.value)}
            </text>
          </g>
        ))}

        {/* x tick labels */}
        {xTicks.map((tick, idx) => (
          <g key={`xt-${idx}`}>
            <line
              x1={tick.x}
              y1={142}
              x2={tick.x}
              y2={146}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
            />
            <text
              x={tick.x}
              y={157}
              textAnchor={idx === 0 ? "start" : "end"}
              fontSize="10"
              fill="rgba(255,255,255,0.65)"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* line glow */}
        <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
        {/* main line */}
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
          marginTop: 2,
        }}
      >
        <span>
          min: {formatNumber(min)} · max: {formatNumber(max)}
        </span>
      </div>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(Number(n) || 0));
}

function formatCompactNumber(n) {
  const value = Number(n) || 0;

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `${Math.round(value)}`;
}