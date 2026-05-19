import React, { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [complaints, setComplaints] = useState([]);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
    category: "",
    location: ""
  });

  // GET
  const fetchComplaints = async () => {
    const res = await fetch(`${API}/complaints`);
    const data = await res.json();
    setComplaints(data.complaints || []);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // CREATE
  const addComplaint = async () => {
    await fetch(`${API}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm({
      name: "",
      email: "",
      title: "",
      description: "",
      category: "",
      location: ""
    });

    fetchComplaints();
  };

  // UPDATE
  const updateStatus = async (id, status) => {
    await fetch(`${API}/complaints/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    fetchComplaints();
  };

  // AI
  const analyzeAI = async (complaint) => {
    setLoading(true);
    setAiResult("");

    try {
      const res = await fetch(`${API}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complaint)
      });

      const data = await res.json();
      setAiResult(data.result || data.error || "No response");
    } catch (err) {
      setAiResult("AI request failed");
    }

    setLoading(false);
  };

  return (
    <div className="dashboard">

      <section className="form-section">
        <h1>Complaint Form</h1>

        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />

        <button onClick={addComplaint}>Submit</button>
      </section>

      <section className="candidate-section">
        <h1>Complaints</h1>

        {complaints.map((c) => (
          <div className="card" key={c._id}>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <p className="status">{c.status}</p>

            <button onClick={() => updateStatus(c._id, "In Progress")}>
              In Progress
            </button>

            <button onClick={() => updateStatus(c._id, "Resolved")}>
              Resolved
            </button>

            <button onClick={() => analyzeAI(c)}>
              AI Analyze
            </button>
          </div>
        ))}
      </section>

      <section className="ai-section">
        <h1>AI Result</h1>
        {loading ? "Analyzing..." : <pre>{aiResult}</pre>}
      </section>

    </div>
  );
}