export default function SummaryCards({ items }) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <article className="summary-card" key={item.label}>
          <p>{item.label}</p>
          <strong>{item.value}</strong>
          {item.helper ? <span>{item.helper}</span> : null}
        </article>
      ))}
    </div>
  );
}
