// frontend/src/components/NavBar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavBar = ({ theme, onToggleTheme }) => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-brand">CPU Arch Simulator</div>
        <div className="nav-links">
          <Link className={isActive("/")} to="/">
            Home
          </Link>
          <Link className={isActive("/simulator")} to="/simulator">
            Simulator
          </Link>
          <Link className={isActive("/docs")} to="/docs">
            Docs
          </Link>
          <Link className={isActive("/account")} to="/account">
            Account
          </Link>
        </div>
      </div>
      <div className="nav-right">
        <button
          className="theme-toggle-btn"
          type="button"
          onClick={onToggleTheme}
          title="Toggle light/dark mode"
        >
          {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
