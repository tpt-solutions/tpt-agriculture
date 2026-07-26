// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
/**
 * Lightweight SVG bar chart — no external dependencies. Used by the
 * Analytics page to visualise production/KPI trends.
 */

interface BarChartData {
  label: string;
  value: number;
}

export function BarChart({
  data,
  title,
  height = 200,
  barColor = "#16a34a",
  formatValue,
}: {
  data: BarChartData[];
  title?: string;
  height?: number;
  barColor?: string;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const barWidth = Math.max(8, Math.min(40, Math.floor(500 / data.length)));
  const gap = Math.max(2, Math.floor(barWidth * 0.3));
  const svgWidth = data.length * (barWidth + gap);
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <div>
      {title && <h4 className="mb-2 text-xs font-semibold text-gray-600">{title}</h4>}
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${height + 30}`}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Baseline */}
        <line x1={0} y1={height} x2={svgWidth} y2={height} stroke="#e5e7eb" strokeWidth={1} />

        {data.map((d, i) => {
          const barH = (Math.abs(d.value) / maxVal) * (height - 4);
          const x = i * (barWidth + gap);
          const y = height - barH;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={barColor}
                rx={2}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={height + 12}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize={8}
              >
                {d.label.length > 6 ? d.label.slice(0, 5) + "\u2026" : d.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-gray-700"
                fontSize={8}
              >
                {fmt(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Simple line chart for showing trends over time.
 */
export function LineChart({
  data,
  title,
  height = 200,
  lineColor = "#16a34a",
}: {
  data: BarChartData[];
  title?: string;
  height?: number;
  lineColor?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const svgWidth = Math.max(200, data.length * 60);
  const stepX = svgWidth / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - (d.value / maxVal) * (height - 4),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div>
      {title && <h4 className="mb-2 text-xs font-semibold text-gray-600">{title}</h4>}
      <svg width="100%" viewBox={`0 0 ${svgWidth} ${height + 30}`} preserveAspectRatio="xMidYMid meet">
        <line x1={0} y1={height} x2={svgWidth} y2={height} stroke="#e5e7eb" strokeWidth={1} />
        <path d={areaD} fill={lineColor} opacity={0.1} />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={data[i].label}>
            <circle cx={p.x} cy={p.y} r={3} fill={lineColor} />
            <text
              x={p.x}
              y={height + 12}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize={8}
            >
              {data[i].label.length > 6 ? data[i].label.slice(0, 5) + "\u2026" : data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
