"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (isLogin) {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setMessage(error.message || "Login failed.");
        return;
      }

      setMessage("Logged in successfully!");
    } else {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setMessage(error.message || "Sign up failed.");
        return;
      }

      setMessage("Account created successfully!");
    }
  }

  return (
    <main>
      <h1>{isLogin ? "Log in" : "Create an account"}</h1>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit">
          {isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={() => {
          setIsLogin(!isLogin);
          setMessage("");
        }}
      >
        {isLogin
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>
    </main>
  );
}