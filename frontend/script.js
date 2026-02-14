document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("studentForm");

  form.addEventListener("submit", async function(e) {

    e.preventDefault();

    const student = {
      cgpa: parseFloat(cgpa.value),
      ielts: parseFloat(ielts.value),
      gre: parseInt(gre.value),
      budget: parseInt(budget.value),
      course: course.value
    };

    const response = await fetch("/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });

    const data = await response.json();

    const dashboard = document.getElementById("dashboard");
    const resultsDiv = document.getElementById("results");
    const aiInsight = document.getElementById("aiInsight");
    const gaugeValue = document.getElementById("gaugeValue");
    const probCategory = document.getElementById("probCategory");

    resultsDiv.innerHTML = "";

    if (data.total_found === 0) {
      resultsDiv.innerHTML = "<p>No universities matched.</p>";
      dashboard.classList.remove("hidden");
      return;
    }

    // Use highest probability for gauge
    const topChance = data.recommendations[0].admission_chance;

    gaugeValue.textContent = topChance + "%";

    const gauge = document.querySelector(".gauge");
    gauge.style.background =
      `conic-gradient(#22c55e ${topChance}%, #e5e7eb ${topChance}%)`;

    if (topChance > 75) probCategory.textContent = "Safe";
    else if (topChance > 50) probCategory.textContent = "Competitive";
    else probCategory.textContent = "Ambitious";

    data.recommendations.forEach((u, index) => {

      let roiClass = "roi-low";
      if (u.roi_level === "High") roiClass = "roi-high";
      if (u.roi_level === "Medium") roiClass = "roi-medium";

      resultsDiv.innerHTML += `
        <div class="result-card">
          <h3>#${index + 1} ${u.university_name}</h3>
          <p>🌍 ${u.country}</p>
          <p class="${roiClass}">ROI: ${u.roi_level}</p>
          <p>Admission Chance: ${u.admission_chance}%</p>
          <p class="fit-${u.category.toLowerCase()}">
            Fit: ${u.category}
          </p>
        </div>
      `;
    });

    aiInsight.textContent = data.ai_insight;
    dashboard.classList.remove("hidden");

  });

});
