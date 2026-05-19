const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

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

// GET ALL
app.get("/api/complaints", async (req, res) => {
  const data = await Complaint.find().sort({ createdAt: -1 });
  res.json({ complaints: data });
});

// UPDATE STATUS
app.put("/api/complaints/:id", async (req, res) => {
  const updated = await Complaint.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, updated });
});

// AI ANALYSIS
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { title, description, category } = req.body;

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

    res.json({
      result: response.data.choices?.[0]?.message?.content
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));