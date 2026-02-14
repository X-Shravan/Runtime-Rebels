function calculateROI(university) {
  const roi =
    (university.avg_salary - university.tuition_fee) /
    university.tuition_fee;

  let level = "Low";

  if (roi > 1) level = "High";
  else if (roi > 0.5) level = "Medium";

  return {
    roi: roi.toFixed(2),
    level
  };
}

module.exports = { calculateROI };
