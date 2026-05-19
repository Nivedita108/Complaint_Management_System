import React, { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [complaints, setComplaints] = useState([]);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
    category: "",
    location: ""
  });

  const isEmpty = (v) => !v || v.trim() === "";

  const fetchComplaints = async () => {
    const res = await fetch(`${API}/complaints`);
    const data = await res.json();
    setComplaints(data.complaints || []);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addComplaint = async () => {
    setSubmitted(true);

    const invalid =
      isEmpty(form.name) ||
      isEmpty(form.email) ||
      isEmpty(form.title) ||
      isEmpty(form.description) ||
      isEmpty(form.category) ||
      isEmpty(form.location);

    if (invalid) return;

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

    setSubmitted(false);
    fetchComplaints();
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/complaints/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    fetchComplaints();
  };

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
    } catch {
      setAiResult("AI request failed");
    }

    setLoading(false);
  };

  const error = (field) => submitted && isEmpty(form[field]);

  const hasError =
    submitted &&
    (isEmpty(form.name) ||
      isEmpty(form.email) ||
      isEmpty(form.title) ||
      isEmpty(form.description) ||
      isEmpty(form.category) ||
      isEmpty(form.location));

  return (
    <div className="dashboard">

      {/* FORM */}
      <section className="form-section">
        <h1>Complaint Form</h1>

        {hasError && (
          <div className="global-error">
            ⚠ Please fill all required fields before submitting
          </div>
        )}

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className={error("name") ? "error" : ""}
        />
        {error("name") && <small className="error-text">Name is required</small>}

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className={error("email") ? "error" : ""}
        />
        {error("email") && <small className="error-text">Email is required</small>}

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className={error("title") ? "error" : ""}
        />
        {error("title") && <small className="error-text">Title is required</small>}

        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category"
          className={error("category") ? "error" : ""}
        />
        {error("category") && <small className="error-text">Category is required</small>}

        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          className={error("location") ? "error" : ""}
        />
        {error("location") && <small className="error-text">Location is required</small>}

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className={error("description") ? "error" : ""}
        />
        {error("description") && (
          <small className="error-text">Description is required</small>
        )}

        <button onClick={addComplaint}>Submit Complaint</button>
      </section>

      {/* LIST */}
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

      {/* AI */}
      <section className="ai-section">
        <h1>AI Result</h1>
        {loading ? "Analyzing..." : <pre>{aiResult}</pre>}
      </section>

    </div>
  );
}