const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(express.json());

// FIXED CORS FOR RENDER + LOCAL
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= MODEL ================= */

const complaintSchema = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  description: String,
  category: String,
  location: String,
  status: {
    type: String,
    default: "Pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

/* ================= ROUTES ================= */

// CREATE
app.post("/api/complaints", async (req, res) => {
  try {
    const data = await Complaint.create(req.body);
    res.json({ success: true, complaint: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET
app.get("/api/complaints", async (req, res) => {
  const data = await Complaint.find().sort({ createdAt: -1 });
  res.json({ complaints: data });
});

// UPDATE
app.put("/api/complaints/:id", async (req, res) => {
  const updated = await Complaint.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ success: true, updated });
});

// AI
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // SAFE GUARD (FIXES YOUR "undefined req.body" ISSUE)
    if (!title || !description || !category) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const prompt = `
Return ONLY JSON:

{
  "priority": "Low | Medium | High",
  "department": "",
  "summary": "",
  "autoResponse": ""
}

Complaint:
Title: ${title}
Description: ${description}
Category: ${category}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const ai = response.data?.choices?.[0]?.message?.content;

    res.json({ result: ai || "No response from AI" });

  } catch (err) {
    console.log("AI ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

/* ================= START ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));