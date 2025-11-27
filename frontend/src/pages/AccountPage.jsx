import React, { useEffect, useState } from "react";
import api from "../api";

const AccountPage = () => {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [configs, setConfigs] = useState([]);

  const fetchMe = async () => {
    const res = await api.get("/me");
    setUser(res.data.user);
  };

  const fetchConfigs = async () => {
    if (!user) return;
    const res = await api.get("/configs");
    setConfigs(res.data);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "/login" : "/register";
    const res = await api.post(endpoint, form);
    if (res.data.username) {
      setUser({ username: res.data.username });
      setForm({ username: "", password: "" });
    }
  };

  const handleLogout = async () => {
    await api.post("/logout");
    setUser(null);
    setConfigs([]);
  };

  return (
    <section className="page">
      <h1>Account</h1>

      {user ? (
        <>
          <p>Logged in as <strong>{user.username}</strong></p>
          <button onClick={handleLogout}>Logout</button>

          <h2>Saved Configurations</h2>
          {configs.length === 0 ? (
            <p>No saved configs yet. Use the simulator and POST to /api/configs.</p>
          ) : (
            <ul>
              {configs.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong>
                  <pre>{JSON.stringify(c.config, null, 2)}</pre>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <p>Login or register to save your configurations.</p>
          <div className="auth-toggle">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
            <button type="submit">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

export default AccountPage;
