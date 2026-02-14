require("dotenv").config();

async function generateAIInsight(student, universities) {
  try {

    if (!process.env.GEMINI_API_KEY) {
      return "API key not loaded.";
    }

    const prompt = `
You are a professional overseas education consultant.

Generate a well-structured admission analysis report.

Formatting Rules (VERY IMPORTANT):
1. Start with a short 2–3 sentence overview paragraph.
2. Leave one blank line after the paragraph.
3. Then provide clearly formatted bullet points using "-".
4. Each bullet must start on a new line.
5. Keep total response under 120 words.
6. Keep tone professional and concise.
7. Do NOT write one long paragraph.

Student Profile:
CGPA: ${student.cgpa}
IELTS: ${student.ielts}
GRE: ${student.gre}
Budget: ${student.budget}
Course: ${student.course}

Recommended Universities:
${universities.map(u => 
`- ${u.university_name} (${u.country}) | Admission Chance: ${u.admission_chance}% | ROI: ${u.roi_level}`
).join("\n")}

Report Sections:
- Overall Assessment
- Key Strengths
- Potential Risks
- Financial / ROI Perspective
- Strategic Recommendation
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("Gemini Status:", response.status);

    if (
      data &&
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    return "AI insight unavailable.";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI service temporarily unavailable.";
  }
}

module.exports = { generateAIInsight };
