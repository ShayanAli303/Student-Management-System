export default function Sidebar({ items, active, onChange, user, onLogout, theme, onToggleTheme, isOpen, onClose }) {
  return (
    <>
      <div className={isOpen ? "sidebar-overlay active" : "sidebar-overlay"} onClick={onClose} />
      <aside className={isOpen ? "sidebar active" : "sidebar"}>
        <div className="sidebar-mobile-bar">
          <p className="eyebrow">Navigation</p>
          <button className="icon-toggle" onClick={onClose} type="button" aria-label="Close menu">
            x
          </button>
        </div>
      <div className="brand-block">
        <p className="eyebrow">Student Management</p>
        <h1>SMS Control</h1>
        <span>{user.full_name}</span>
      </div>
      <button className="theme-toggle sidebar-theme-toggle" onClick={onToggleTheme} type="button">
        {theme === "light" ? "Dark Mode" : "Light Mode"}
      </button>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={item.key === active ? "nav-button active" : "nav-button"}
            onClick={() => {
              onChange(item.key);
              onClose();
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="ghost-button sidebar-logout" onClick={onLogout} type="button">
        Logout
      </button>
      </aside>
    </>
  );
}
