"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Small SVG charts drawn from real series: a line that rises and falls with a dot on every
 * point, and a ring split by share. Colors come from the theme tokens through `className`
 * (stroke-* / fill-*), so they follow light and dark.
 */

export type LineSeries = {
  label: string;
  values: number[];
  /** Tailwind stroke + fill classes, e.g. "stroke-primary fill-primary". */
  tone: string;
  /** Draws a soft area under the line. */
  area?: boolean;
  format?: (value: number) => string;
};

export function LineChart({
  series,
  labels,
  height = 180,
  baseline = false,
  ariaLabel,
}: {
  series: LineSeries[];
  /** One label per point (e.g. the day). */
  labels: string[];
  height?: number;
  /** Draws a line at zero, for values that go below it. */
  baseline?: boolean;
  ariaLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const width = 640;
  const pad = { top: 14, right: 12, bottom: 22, left: 12 };
  const all = series.flatMap((item) => item.values);
  const max = Math.max(...all, baseline ? 0 : 1);
  const min = Math.min(...all, 0);
  const span = max - min || 1;
  const count = labels.length;
  const x = (index: number) =>
    pad.left +
    (index * (width - pad.left - pad.right)) / Math.max(count - 1, 1);
  const y = (value: number) =>
    pad.top + ((max - value) * (height - pad.top - pad.bottom)) / span;
  const step = Math.ceil(count / 6);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setActive(null)}
      >
        {[0.25, 0.5, 0.75].map((share) => (
          <line
            key={share}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + share * (height - pad.top - pad.bottom)}
            y2={pad.top + share * (height - pad.top - pad.bottom)}
            className="stroke-border"
            strokeDasharray="2 4"
          />
        ))}
        {baseline && min < 0 && (
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(0)}
            y2={y(0)}
            className="stroke-muted-foreground/50"
          />
        )}
        {series.map((item) => {
          const points = item.values.map((value, index) => [
            x(index),
            y(value),
          ]);
          const path = points
            .map(([px, py], index) => `${index ? "L" : "M"}${px},${py}`)
            .join(" ");
          return (
            <g key={item.label} className={item.tone}>
              {item.area && (
                <path
                  d={`${path} L${x(count - 1)},${y(Math.max(min, 0))} L${x(0)},${y(Math.max(min, 0))} Z`}
                  style={{ stroke: "none", fillOpacity: 0.1 }}
                />
              )}
              <path
                d={path}
                style={{ fill: "none" }}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map(([px, py], index) => (
                <circle
                  key={index}
                  cx={px}
                  cy={py}
                  r={active === index ? 5 : index === count - 1 ? 4 : 3}
                  className={cn(
                    "transition-[r] duration-150 motion-reduce:transition-none",
                    index === count - 1 || active === index ? "" : "fill-card",
                  )}
                  strokeWidth={2}
                />
              ))}
            </g>
          );
        })}
        {labels.map((label, index) =>
          index === count - 1 ||
          (index % step === 0 && count - 1 - index >= step / 2) ? (
            <text
              key={index}
              x={x(index)}
              y={height - 4}
              textAnchor={
                index === 0 ? "start" : index === count - 1 ? "end" : "middle"
              }
              className="fill-muted-foreground text-[11px]"
            >
              {label}
            </text>
          ) : null,
        )}
        {labels.map((_, index) => (
          <rect
            key={index}
            x={
              x(index) -
              (width - pad.left - pad.right) / Math.max(count - 1, 1) / 2
            }
            y={0}
            width={(width - pad.left - pad.right) / Math.max(count - 1, 1)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setActive(index)}
          />
        ))}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(x(active) / width) * 100}%`,
            transform: `translateX(${active > count / 2 ? "-100%" : "0"})`,
          }}
        >
          <p className="font-medium">{labels[active]}</p>
          {series.map((item) => (
            <p key={item.label} className="text-muted-foreground tabular-nums">
              {item.label}:{" "}
              <span className="text-foreground">
                {(item.format ?? String)(item.values[active] ?? 0)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export type RingSlice = {
  label: string;
  value: number;
  /** Tailwind stroke and fill classes, both written out, e.g. "stroke-primary fill-primary". */
  tone: string;
};

/** A ring split by share, with the total (or a chosen figure) in the middle. */
export function RingChart({
  slices,
  center,
  caption,
  size = 132,
  ariaLabel,
}: {
  slices: RingSlice[];
  center: string;
  caption: string;
  size?: number;
  ariaLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="size-full -rotate-90"
          role="img"
          aria-label={ariaLabel}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            className="stroke-muted"
          />
          {total > 0 &&
            slices.map((slice) => {
              const length = (slice.value / total) * circumference;
              const dash = (
                <circle
                  key={slice.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  style={{ fill: "none" }}
                  strokeWidth="9"
                  strokeLinecap="butt"
                  className={cn(
                    slice.tone,
                    "transition-[stroke-dasharray] duration-700 motion-reduce:transition-none",
                  )}
                  strokeDasharray={`${Math.max(length - 1.5, 0)} ${circumference}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return dash;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-light tabular-nums">{center}</span>
          <span className="text-[11px] text-muted-foreground">{caption}</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {slices.map((slice) => (
          <li
            key={slice.label}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <svg
                viewBox="0 0 10 10"
                className="size-2.5 shrink-0"
                aria-hidden
              >
                <circle
                  cx="5"
                  cy="5"
                  r="5"
                  className={slice.tone}
                  style={{ stroke: "none" }}
                />
              </svg>
              <span className="truncate text-muted-foreground">
                {slice.label}
              </span>
            </span>
            <span className="tabular-nums">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
