"use client";

import { useState, useEffect } from "react";

export default function EmailConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [email, setEmail] = useState("");
  const [connectionType, setConnectionType] = useState("IMAP");
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/email-ingestion/configure")
      .then((res) => res.json())
      .then((data) => setConfigs(data));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch("/api/email-ingestion/configure", {
      method: "POST",
      body: JSON.stringify({ email, connectionType, host, username, password }),
      headers: { "Content-Type": "application/json" },
    });
    window.location.reload();
  };

  return (
    <div>
      <h1>Email Configuration</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <select onChange={(e) => setConnectionType(e.target.value)}>
          <option value="IMAP">IMAP</option>
          <option value="POP3">POP3</option>
        </select>
        <input type="text" placeholder="Host" onChange={(e) => setHost(e.target.value)} />
        <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Save</button>
      </form>
      <h2>Configured Accounts</h2>
      <ul>
        {configs.map((config: any) => (
          <li key={config.id}>{config.emailAddress} ({config.connectionType})</li>
        ))}
      </ul>
    </div>
  );
}
