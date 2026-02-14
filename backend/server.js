// 🔥 FORCE dotenv to load from backend folder
require("dotenv").config({ path: __dirname + "/.env" });

console.log("Loaded SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("Loaded SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY);

const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const { generateAIInsight } = require("./services/gemini");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= SAFETY CHECK ================= */

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ ENV variables not loaded properly.");
  process.exit(1);
}

/* ================= SUPABASE CONNECTION ================= */

const supabase = createClient(
  process.env.SUPABASE_URL.trim(),
  process.env.SUPABASE_ANON_KEY.trim()
);

/* ================= SERVE FRONTEND ================= */

/* ================= SERVE FRONTEND ================= */

/* ================= SERVE FRONTEND ================= */

const frontendPath = path.resolve(__dirname, "../frontend");

// 🔥 Make home.html primary FIRST
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "home.html"));
});

// Then serve static files
app.use(express.static(frontendPath));

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(frontendPath, "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

/* ================= BUSINESS LOGIC ================= */

function calculateROI(uni) {
  const roi = (uni.avg_salary - uni.tuition_fee) / uni.tuition_fee;

  let level = "Low";
  if (roi > 1) level = "High";
  else if (roi > 0.5) level = "Medium";

  return {
    roi: roi.toFixed(2),
    level,
    break_even_years: (uni.tuition_fee / uni.avg_salary).toFixed(2)
  };
}

function categorize(student, uni) {
  if (student.cgpa >= uni.min_cgpa + 1) return "Safe";
  if (student.cgpa >= uni.min_cgpa) return "Moderate";
  return "Ambitious";
}

/* ================= RECOMMENDATION API ================= */

app.post("/recommend", async (req, res) => {
  try {

    const student = {
      cgpa: Number(req.body.cgpa),
      ielts: Number(req.body.ielts),
      gre: Number(req.body.gre),
      budget: Number(req.body.budget),
      course: req.body.course?.trim()
    };

    if (!student.cgpa || !student.ielts || !student.gre || !student.budget || !student.course) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const { data: universities, error } = await supabase
      .from("universities")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const eligible = universities.filter(u =>
      student.cgpa >= u.min_cgpa - 0.5 &&
      student.ielts >= u.min_ielts - 0.5 &&
      student.budget >= u.tuition_fee &&
      u.course.toLowerCase().includes(student.course.toLowerCase())
    );

    const recommendations = eligible.map(u => {

      const baseScore =
        (student.cgpa / 10) * 40 +
        (student.ielts / 9) * 25 +
        (student.gre / 340) * 20;

      const cgpaDiff = student.cgpa - u.min_cgpa;
      const ieltsDiff = student.ielts - u.min_ielts;

      const fitScore = (cgpaDiff * 5) + (ieltsDiff * 3);

      let admissionChance = baseScore + fitScore;
      admissionChance = Math.max(5, Math.min(95, admissionChance));

      const roiData = calculateROI(u);

      return {
        university_name: u.university_name,
        country: u.country,
        category: categorize(student, u),
        admission_chance: parseFloat(admissionChance.toFixed(1)),
        roi: roiData.roi,
        roi_level: roiData.level,
        break_even_years: roiData.break_even_years
      };
    });

    recommendations.sort((a, b) => b.admission_chance - a.admission_chance);

    const topFive = recommendations.slice(0, 5);

    const aiInsight = await generateAIInsight(student, topFive);

    res.json({
      total_found: topFive.length,
      recommendations: topFive,
      ai_insight: aiInsight
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    const insertResult = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        full_name,
        email,
        phone,
        role
      }
    ]);

    console.log("Insert result:", insertResult);

    if (insertResult.error) {
      return res.status(400).json({ error: insertResult.error.message });
    }

    res.json({ message: "Registration successful" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: "Login successful",
      session: data.session
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});



/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
