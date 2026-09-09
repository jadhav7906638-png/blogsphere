import { useState } from "react";
import API from "../api";

function Register({ onRegister, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await API.post("/auth/register", {
        name,
        email,
        password,
      });

      alert(response.data.message || "Registration successful! 🎉");

      setName("");
      setEmail("");
      setPassword("");

      onLogin();
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        alert(
          error.response.data?.message ||
            `Registration failed (${error.response.status})`
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
        <div className="auth-icon">A</div>

        <p className="tag">JOIN THE COMMUNITY</p>

        <h1>Create Your Account</h1>

        <p className="auth-subtitle">
          Start writing, sharing and connecting with readers.
        </p>

        <form onSubmit={handleRegister}>
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Create Account →
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <button type="button" onClick={onLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;