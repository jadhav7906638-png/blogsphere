import { useState } from "react";
import API from "../api";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      alert("Login successful! 🎉");
      onLogin();
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        alert(
          error.response.data.message ||
            "Invalid email or password"
        );
      } else {
        alert(
          "Unable to connect to server. Make sure backend is running."
        );
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="tag">WELCOME BACK</p>

        <h1>Login to BlogSphere</h1>

        <p className="auth-subtitle">
          Continue sharing your stories with the community.
        </p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Login →
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onRegister}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;