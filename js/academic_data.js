// js/academic_data.js - Master Directory for Spiritual Literature Sub-Rooms & Academic Streams

// ============================================================================
// ✝️ SPIRITUAL ROOM: SUB-ROOM CATEGORIES & PDF COLLECTIONS
// ============================================================================
export const spiritualCategories = [
  {
    id: "baptism",
    name: "Baptism (ጥምቀት)",
    icon: "fa-water",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    description: "Biblical exposition, scriptural foundations, and historical studies on water baptism in Jesus' name.",
    pdfs: [
      {
        title: "Scriptural Foundation of Water Baptism in the Name of Jesus Christ",
        author: "ACE Theological Advisory Board",
        size: "1.8 MB",
        downloads: "1,420",
        fileUrl: "#"
      },
      {
        title: "The Acts of the Apostles & The Baptismal Formula",
        author: "Pastoral Guidance Ministry",
        size: "1.2 MB",
        downloads: "980",
        fileUrl: "#"
      }
    ]
  },
  {
    id: "holyspirit",
    name: "Holy Spirit (መንፈስ ቅዱስ)",
    icon: "fa-fire-flame-curved",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description: "Teachings on the infilling of the Holy Ghost, initial evidence of speaking in tongues, and spiritual gifts.",
    pdfs: [
      {
        title: "Receiving the Gift of the Holy Ghost: Biblical Promises & Experience",
        author: "ACE National Ministry Council",
        size: "2.1 MB",
        downloads: "2,150",
        fileUrl: "#"
      },
      {
        title: "Walking in the Anointing, Power, and Fruit of the Spirit",
        author: "Campus Evangelical Leadership",
        size: "1.5 MB",
        downloads: "1,120",
        fileUrl: "#"
      }
    ]
  },
  {
    id: "doctrine",
    name: "Church & Oneness Doctrine (ትምህርተ መለኮት)",
    icon: "fa-church",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
    description: "Literature on the Oneness of God, Apostolic heritage, and local church structure.",
    pdfs: [
      {
        title: "The Oneness of God: Comprehensive Biblical Exposition",
        author: "ACE Pastoral Council",
        size: "3.2 MB",
        downloads: "3,110",
        fileUrl: "#"
      },
      {
        title: "History, Creed, and Identity of the Apostolic Church of Ethiopia",
        author: "ACE Heritage & Publications",
        size: "2.8 MB",
        downloads: "1,640",
        fileUrl: "#"
      }
    ]
  },
  {
    id: "bible",
    name: "Bible Study & Scripture (መጽሐፍ ቅዱስ)",
    icon: "fa-book-bible",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "Verse-by-verse commentaries, weekly fellowship manuals, and personal devotion guides.",
    pdfs: [
      {
        title: "Weekly Campus Fellowship Study & Discussion Manual (12-Week Series)",
        author: "ACE Student Fellowship Secretariat",
        size: "2.0 MB",
        downloads: "1,890",
        fileUrl: "#"
      },
      {
        title: "Hermeneutics: How to Read and Apply Holy Scripture",
        author: "ACE Academic Advisory Committee",
        size: "1.4 MB",
        downloads: "1,230",
        fileUrl: "#"
      }
    ]
  },
  {
    id: "youth",
    name: "Youth & Righteousness)",
    icon: "fa-person-shelter",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    description: "Living a consecrated life, purity, overcoming peer pressure, and Christian character on university campuses.",
    pdfs: [
      {
        title: "Maintaining Spiritual Consecration in Higher Education",
        author: "ACE Youth Fellowship Leaders",
        size: "1.6 MB",
        downloads: "2,450",
        fileUrl: "#"
      },
      {
        title: "Purity, Relationships, Courtship, and Divine Purpose",
        author: "Youth Mentorship Secretariat",
        size: "1.9 MB",
        downloads: "1,980",
        fileUrl: "#"
      }
    ]
  },
  {
    id: "Repentance",
    name: "Repentance / (ንስሐ)",
    icon: "fa-hands-praying",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    description: "Biblical truth on repentance, brokenness, divine forgiveness, and spiritual renewal.",
    pdfs: [
      {
        title: "The Grace of True Repentance & Heart Transformation",
        author: "ACE Pastoral Counseling Board",
        size: "1.3 MB",
        downloads: "1,520",
        fileUrl: "#"
      },
      {
        title: "Restoration, Forgiveness, and Overcoming Guilt",
        author: "Counseling & Care Ministry",
        size: "1.1 MB",
        downloads: "890",
        fileUrl: "#"
      }
    ]
  },
  {
    id: "Fasting",
    name: "Fasting & Prayer / (ጾም እና ጸሎት)",
    icon: "fa-heart-pulse",
    badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    description: "Manuals on spiritual fasting, intercession, building a prayer routine, and spiritual warfare.",
    pdfs: [
      {
        title: "Biblical Fasting: Purpose, Spiritual Power, and Practice",
        author: "ACE Prayer & Intercession Ministry",
        size: "1.7 MB",
        downloads: "2,210",
        fileUrl: "#"
      },
      {
        title: "Sustaining an Effective Daily Prayer Routine in College",
        author: "ACE Student Network",
        size: "1.0 MB",
        downloads: "1,750",
        fileUrl: "#"
      }
    ]
  }
];


// ============================================================================
// 🎓 ACADEMIC ROOM: FRESHMAN STREAMS & COURSES
// ============================================================================
export const freshmanStreams = {
  natural: {
    name: "Natural Science Stream",
    courses: [
      "General Physics (Phys 1011)",
      "General Chemistry (Chem 1011)",
      "Applied Mathematics / Calculus (Math 1011)",
      "Communicative English Skills I & II",
      "Critical Thinking & Logic (Phil 1011)",
      "Introduction to Emerging Technologies",
      "Physical Fitness & Health"
    ],
    advices: [
      {
        author: "Abel Tekle (Senior Software Engineer, AAU Alumni)",
        text: "Focus heavily on Applied Math and Physics early in the semester. Building disciplined daily study habits in your first 2 months determines your stream placement!"
      },
      {
        author: "Dr. Martha Getachew (Medical Resident, Gondar)",
        text: "Form small prayer and study groups with fellow Apostolic students. Balancing campus fellowship and a scheduled study timetable keeps you mentally and spiritually grounded."
      }
    ]
  },
  social: {
    name: "Social Science Stream",
    courses: [
      "Introduction to Economics (Econ 1011)",
      "General Psychology (Psyc 1011)",
      "Geography of Ethiopia and the Horn",
      "Communicative English Skills I & II",
      "Social Anthropology (Anth 1011)",
      "Global Trends & History of Ethiopia",
      "Critical Thinking & Logic"
    ],
    advices: [
      {
        author: "Bethlehem Worku (Management Graduate, Hawassa)",
        text: "Read consistently every week rather than cramming before midterms. Economics and Logic require conceptual understanding rather than simple memorization."
      },
      {
        author: "Yonas Tadesse (Law Senior, AAU)",
        text: "Engage actively in weekly fellowship gatherings. Having spiritual brothers and sisters around provides peace and clarity during high-stress exam periods."
      }
    ]
  }
};


// ============================================================================
// 🏢 ACADEMIC ROOM: SENIOR DEPARTMENTS, EXIT EXAM PREP & ADVICE
// ============================================================================
export const seniorDepartments = [
  // --- Health Sciences & Medicine ---
  {
    id: "med",
    name: "Medicine & Public Health",
    group: "Health Sciences",
    courses: [
      "Anatomy & Physiology Modules",
      "Biochemistry & Metabolic Pathways",
      "General & Systemic Pathology",
      "Pharmacology & Therapeutics",
      "Internal Medicine & Surgery Reviews",
      "National Medical Exit Exam Sample Questions"
    ],
    advices: [
      {
        author: "Dr. Samuel Alemu (ACE Medical Fellowship Coordinator)",
        text: "Master fundamental concepts in Pathology and Biochemistry during pre-clinical years. They form the foundation for clinical ward rotations and the National Exit Exam."
      }
    ]
  },
  {
    id: "pharm",
    name: "Pharmacy",
    group: "Health Sciences",
    courses: [
      "Medicinal Chemistry & Drug Structure",
      "Pharmacognosy & Natural Products",
      "Pharmaceutics & Dosage Form Design",
      "Clinical Pharmacy & Therapeutics",
      "Toxicology & Patient Safety"
    ],
    advices: [
      {
        author: "Ephrem Tadesse (PharmD Candidate)",
        text: "Keep detailed side-by-side notes on drug mechanisms of action and adverse interactions early in your studies."
      }
    ]
  },
  {
    id: "nursing",
    name: "Nursing & Midwifery",
    group: "Health Sciences",
    courses: [
      "Fundamentals of Nursing Care",
      "Medical-Surgical Nursing",
      "Pediatric & Maternal Health Nursing",
      "Community & Public Health Nursing"
    ],
    advices: [
      {
        author: "Sister Hannah Solomon (BSc Nursing)",
        text: "Treat your clinical ward practice as service to God and humanity. Professional excellence comes through compassionate practice."
      }
    ]
  },

  // --- Engineering & Technology ---
  {
    id: "cs_se",
    name: "Computer Science & Software Engineering",
    group: "Engineering & Tech",
    courses: [
      "Data Structures & Algorithms",
      "Database Management Systems (SQL & NoSQL)",
      "Web Development & JavaScript ES6+",
      "Software Architecture & Object-Oriented Design",
      "National CS/SE Exit Exam Practice Kit"
    ],
    advices: [
      {
        author: "Kaleb Berhanu (Senior Frontend Developer)",
        text: "Don't just pass course exams—build real web applications, contribute to GitHub repositories, and practice algorithm problem-solving regularly!"
      }
    ]
  },
  {
    id: "civil",
    name: "Civil Engineering",
    group: "Engineering & Tech",
    courses: [
      "Structural Analysis I & II",
      "Fluid Mechanics & Hydraulics",
      "Geotechnical Engineering",
      "Reinforced Concrete Design",
      "Highway & Transportation Engineering"
    ],
    advices: [
      {
        author: "Eng. Nathan Dawit (Civil Engineer)",
        text: "Focus deeply on Structural Analysis principles. Consistent hand-calculation practice is key to mastering engineering design."
      }
    ]
  },
  {
    id: "ee",
    name: "Electrical & Computer Engineering",
    group: "Engineering & Tech",
    courses: [
      "Circuit Theory & Microelectronics",
      "Signals & Systems",
      "Control Systems Engineering",
      "Digital Signal Processing",
      "Power Systems Analysis"
    ],
    advices: [
      {
        author: "Eng. Dawit Firew (Electrical Engineer)",
        text: "Master MATLAB, Proteus, and circuit simulation software early alongside your theoretical course modules."
      }
    ]
  },

  // --- Business & Economics ---
  {
    id: "acc",
    name: "Accounting & Finance",
    group: "Business & Economics",
    courses: [
      "Financial Accounting & Reporting",
      "Cost & Managerial Accounting",
      "Auditing & Assurance Standards",
      "Financial Management & Investment",
      "Taxation System in Ethiopia"
    ],
    advices: [
      {
        author: "Tigist Haile (CPA & Finance Officer)",
        text: "Practice accounting exercises daily. Accuracy and speed in financial balance sheets require consistent exercise solving."
      }
    ]
  },
  {
    id: "econ",
    name: "Economics",
    group: "Business & Economics",
    courses: [
      "Microeconomic & Macroeconomic Analysis",
      "Econometrics & Statistical Modeling",
      "Development Economics",
      "Mathematical Economics"
    ],
    advices: [
      {
        author: "Sileshi Bekele (Economist)",
        text: "Build a solid foundation in calculus and statistics—it will make upper-level Econometrics much smoother."
      }
    ]
  },

  // --- Law & Social Sciences ---
  {
    id: "law",
    name: "Law (LL.B)",
    group: "Law & Humanities",
    courses: [
      "Constitutional Law & Human Rights",
      "Criminal Law & Procedure",
      "Civil Code & Contract Law",
      "Commercial & Business Law",
      "National Law Exit Exam Review Kit"
    ],
    advices: [
      {
        author: "Jeremiah Girma (Legal Advisor)",
        text: "Read primary Ethiopian statutory provisions alongside case law. Legal reasoning improves through active debate and reading."
      }
    ]
  }
];

// ============================================================================
// 🛠️ HELPER FUNCTION: POPULATE DEPARTMENT SELECT DROPDOWN
// ============================================================================
export function populateDepartmentSelect(selectElementId) {
  const select = document.getElementById(selectElementId);
  if (!select) return;

  let optionsHTML = `<option value="" disabled selected>Choose your department...</option>`;
  const collegeForGroup = group => group === "Health Sciences"
    ? "College of Medicine & Health Sciences"
    : group === "Engineering & Tech"
      ? "College of Engineering & Technology"
      : "College of Social Sciences";
  const groups = [...new Set(seniorDepartments.map(d => collegeForGroup(d.group)))];

  groups.forEach(group => {
    const list = seniorDepartments.filter(d => collegeForGroup(d.group) === group);
    optionsHTML += `<optgroup label="🏢 ${group}">`;
    list.forEach(dept => {
      optionsHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
    optionsHTML += `</optgroup>`;
  });

  select.innerHTML = optionsHTML;
}
