// ============================================================
//  services/plannerService.js — Smart Planner Business Logic
// ============================================================

/**
 * daysBetween — positive = future, negative = past
 */
function daysBetween(date) {
  if (!date) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

/**
 * urgencyScore — 0 to 50 based on how soon the deadline is
 */
function urgencyScore(days) {
  if (days < 0)  return 50; // overdue — maximum urgency
  if (days === 0) return 48; // today
  if (days <= 2)  return 40;
  if (days <= 5)  return 28;
  if (days <= 10) return 15;
  return 5;
}

/**
 * subjectProgressScore — returns 0–30 based on subject incompleteness.
 */
function subjectProgressScore(subject, progressData) {
  if (!progressData || !Array.isArray(progressData)) return 15;

  const match = progressData.find(
    s => (s.name && subject.name && s.name.toLowerCase() === subject.name.toLowerCase()) ||
         (s._id && subject._id && s._id.toString() === subject._id.toString())
  );
  if (!match) return 15; // unknown subject — neutral score

  const total = match.units ? match.units.length * 8 : 40;
  let done = 0;
  if (Array.isArray(match.units)) {
    match.units.forEach(unit => {
      if (Array.isArray(unit)) done += unit.filter(Boolean).length;
      else if (unit === true) done += 8;
    });
  }
  const completionRatio = total > 0 ? done / total : 0;
  return Math.round((1 - completionRatio) * 30);
}

/**
 * scoreTask — assigns a total priority score to a single task
 */
function scoreTask(task, deadlines, progressData) {
  let score = 0;

  // Base: pending tasks get priority
  if (task.status === "pending") score += 20;
  else return -1; // done tasks are excluded

  // Deadline urgency: find a matching deadline for this subject
  const relatedDeadlines = (deadlines || []).filter(
    d => d.subjectId && task.subjectId &&
         d.subjectId.toString() === task.subjectId.toString() &&
         d.status === "pending"
  );
  
  if (relatedDeadlines.length > 0) {
    const soonest = relatedDeadlines.reduce((min, d) => {
      const days = daysBetween(d.deadline);
      return days < min ? days : min;
    }, 999);
    score += urgencyScore(soonest);
  }

  // Task's own date urgency
  if (task.deadline) {
    score += urgencyScore(daysBetween(task.deadline)) * 0.5;
  }

  // Subject progress deficit logic (if subject data is available)
  // This would need more info from progressData if available
  // score += subjectProgressScore(task.subject, progressData);

  return Math.round(score);
}

/**
 * generateDailySuggestions — main planner suggestion engine
 */
function generateDailySuggestions(tasks, deadlines, progressData, maxResults = 5) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  const scored = tasks
    .filter(t => t.status === "pending" && !t.isDeadline)
    .map(task => {
      const score = scoreTask(task, deadlines, progressData);
      return { ...task.toObject ? task.toObject() : task, _score: score };
    })
    .filter(t => t._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, maxResults);

  return scored.map(task => {
    const reasons = [];

    // Build human-readable reason
    const relatedDl = (deadlines || []).find(
      d => d.subjectId && task.subjectId &&
           d.subjectId.toString() === task.subjectId.toString() &&
           d.status === "pending" && d.deadline
    );
    
    if (relatedDl) {
      const days = daysBetween(relatedDl.deadline);
      if (days < 0) reasons.push(`⚠️ Deadline was ${Math.abs(days)} day(s) ago`);
      else if (days === 0) reasons.push("🔴 Deadline is today!");
      else if (days <= 3)  reasons.push(`🟠 Deadline in ${days} day(s)`);
      else                 reasons.push(`📅 Deadline in ${days} day(s)`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (task.deadline && new Date(task.deadline) < today) {
      reasons.push("⏰ Task is overdue — complete or reschedule");
    }

    return {
      id:       task._id,
      title:    task.title,
      type:     task.type,
      unit:     task.unit,
      duration: task.duration,
      deadline: task.deadline,
      score:    task._score,
      reason:   reasons.length > 0 ? reasons.join(" · ") : "📝 Pending task"
    };
  });
}

/**
 * generateReminders — returns urgent deadline alerts
 */
function generateReminders(tasks, deadlines) {
  const urgentDeadlines = (deadlines || [])
    .filter(d => d.status === "pending" && d.deadline)
    .map(d => {
        const days = daysBetween(d.deadline);
        return { ...d.toObject ? d.toObject() : d, daysLeft: days };
    })
    .filter(d => d.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(d => ({
      id:       d._id,
      title:    d.title,
      deadline: d.deadline,
      daysLeft: d.daysLeft,
      alert:    d.daysLeft < 0
        ? `⚠️ OVERDUE: ${d.title}`
        : d.daysLeft === 0
          ? `🔴 TODAY: ${d.title}`
          : `🟠 ${d.daysLeft} day(s) left: ${d.title}`
    }));

  return { urgentDeadlines };
}

module.exports = {
  generateDailySuggestions,
  generateReminders
};
