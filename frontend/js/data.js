// ============================================================
//  data.js — Shared constants for StudySync
//  Include this BEFORE any page script that needs SEMESTER_SUBJECTS
// ============================================================

const SEMESTER_SUBJECTS = {
  "1": [
    { slug: "pf",    name: "Programming Fundamentals" },
    { slug: "math1", name: "Mathematics-I" },
    { slug: "de",    name: "Digital Electronics" },
    { slug: "cs",    name: "Communication Skills" },
    { slug: "pc",    name: "PC Software" }
  ],
  "2": [
    { slug: "c",     name: "C Programming" },
    { slug: "math2", name: "Mathematics-II" },
    { slug: "ds",    name: "Data Structures" },
    { slug: "co",    name: "Computer Organization" },
    { slug: "evs",   name: "EVS" }
  ],
  "3": [
    { slug: "java",  name: "Java" },
    { slug: "dbms",  name: "DBMS" },
    { slug: "os",    name: "Operating Systems" },
    { slug: "dm",    name: "Discrete Mathematics" },
    { slug: "web",   name: "Web Technologies" }
  ],
  "4": [
    { slug: "cn",    name: "Computer Networks" },
    { slug: "se",    name: "Software Engineering" },
    { slug: "cbnst", name: "CBNST" },
    { slug: "ob",    name: "Organizational Behavior" },
    { slug: "ai",    name: "AI Basics" }
  ],
  "5": [
    { slug: "python", name: "Python" },
    { slug: "cloud",  name: "Cloud Computing" },
    { slug: "cyber",  name: "Cyber Security" },
    { slug: "dm2",    name: "Data Mining" },
    { slug: "mobile", name: "Mobile Computing" }
  ],
  "6": [
    { slug: "ml",       name: "Machine Learning" },
    { slug: "bigdata",  name: "Big Data" },
    { slug: "project",  name: "Project" },
    { slug: "intern",   name: "Internship" },
    { slug: "elective", name: "Elective" }
  ]
};

const LECTURES_PER_UNIT = 8;
const UNITS_PER_SUBJECT = 5;
const STREAK_KEY = "streakData"; // single source of truth — used by dashboard & performance
