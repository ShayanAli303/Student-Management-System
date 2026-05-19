const STATUS_CONFIG = {
  present: { label: "Present", color: "#1b8f5a" },
  absent: { label: "Absent", color: "#d64141" },
  late: { label: "Late", color: "#f08a24" },
};

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function AttendanceDonut({ attendance }) {
  const counts = attendance.reduce(
    (accumulator, record) => {
      if (accumulator[record.status] !== undefined) {
        accumulator[record.status] += 1;
      }
      return accumulator;
    },
    { present: 0, absent: 0, late: 0 },
  );

  const entries = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    key,
    ...config,
    value: counts[key],
  }));

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  let currentAngle = 0;

  return (
    <div className="attendance-chart-card">
      <div className="attendance-chart-header">
        <div>
          <p className="eyebrow">Attendance Graph</p>
          <h3>Attendance Breakdown</h3>
        </div>
        <span>{total} records</span>
      </div>
      <div className="attendance-chart-layout">
        <div className="attendance-chart-shell">
          <svg viewBox="0 0 120 120" className="attendance-chart" role="img" aria-label="Attendance donut chart">
            <circle cx="60" cy="60" r="42" fill="none" stroke="var(--surface-soft)" strokeWidth="14" />
            {total > 0
              ? entries.map((entry) => {
                  if (!entry.value) {
                    return null;
                  }

                  const sweep = (entry.value / total) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + sweep;
                  currentAngle = endAngle;

                  return (
                    <path
                      key={entry.key}
                      d={describeArc(60, 60, 42, startAngle, endAngle)}
                      fill="none"
                      stroke={entry.color}
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  );
                })
              : null}
            <circle cx="60" cy="60" r="28" fill="var(--surface-strong)" />
            <text x="60" y="56" textAnchor="middle" className="attendance-chart-total">
              {total}
            </text>
            <text x="60" y="68" textAnchor="middle" className="attendance-chart-label">
              Total
            </text>
          </svg>
        </div>
        <div className="attendance-legend">
          {entries.map((entry) => (
            <div className="attendance-legend-row" key={entry.key}>
              <div className="attendance-legend-meta">
                <span className="attendance-dot" style={{ backgroundColor: entry.color }} />
                <span>{entry.label}</span>
              </div>
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
