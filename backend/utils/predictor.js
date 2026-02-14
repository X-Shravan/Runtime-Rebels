function calculateAdmissionChance(student) {
  const chance =
    (student.cgpa / 10) * 50 +
    (student.ielts / 9) * 30 +
    (student.gre / 340) * 20;

  return Math.min(parseFloat(chance.toFixed(1)), 100);
}

module.exports = { calculateAdmissionChance };
