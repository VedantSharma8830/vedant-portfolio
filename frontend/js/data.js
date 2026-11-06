/*
 * Portfolio content.
 * This is the one file to edit when something changes (marks, projects, skills...).
 * The page reads it directly, and the backend serves the same data at GET /api/profile.
 */
window.CV = {
  name: "Vedant J. Sharma",
  firstName: "Vedant",
  initials: "VS",
  title: "Electrical Engineering Student",
  tagline: "B.E. 3rd Year · Open to internships",
  location: "Maharashtra, India",
  phone: "+91 88305 88405",
  phoneHref: "tel:+918830588405",
  email: "vedantsharma8830@gmail.com",
  cvFile: "assets/docs/Vedant_Sharma_CV.pdf",
  photo: "assets/img/avatar.webp",

  roles: ["future Electrical Engineer", "automation enthusiast", "problem solver", "hands-on learner"],

  stats: [
    { value: "7.18", label: "Sem 4 SGPA" },
    { value: "81.50%", label: "Diploma aggregate" },
    { value: "4 wks", label: "Industrial training" },
    { value: "2", label: "Projects" },
  ],

  objective:
    "Third-year Electrical Engineering student seeking an internship or entry-level opportunity in an engineering organisation to apply core engineering fundamentals, strengthen practical and problem-solving skills, and learn from industry practices in a professional engineering environment.",

  summary: [
    "Electrical Engineering student with a Diploma in Engineering (81.50% aggregate) followed by a B.E. in Electrical Engineering.",
    "Completed a 4-week industrial training in transformer repair and maintenance, gaining practical exposure to real equipment.",
    "Strong foundation in electrical machines, control systems, and electrical measurements and instrumentation.",
    "Completed academic projects focused on energy efficiency, automation, and reducing power wastage.",
    "Working knowledge of MS Word and basic MATLAB; fluent in English, Hindi, and Marathi.",
  ],

  education: [
    {
      big: "7.18",
      bigLabel: "Sem 4 SGPA",
      stage: "Now",
      degree: "B.E. – Electrical Engineering",
      school: "Shri Sant Gajanan Maharaj College of Engineering, Shegaon",
      score: "Pursuing (3rd Year)",
      points: [
        "Semester 3 SGPA: 7.05 • Semester 4 SGPA: 7.18",
        "Core areas: electrical machines, control systems, electrical measurements and instrumentation.",
      ],
    },
    {
      big: "81.50%",
      bigLabel: "Aggregate",
      stage: "Before that",
      degree: "Diploma in Engineering",
      school: "Siddhivinayak Technical Campus, Sirasgaon Nile",
      score: "81.50% aggregate",
      points: ["Aggregate of 5th and 6th semesters: 81.50%"],
    },
    {
      big: "67.8%",
      bigLabel: "Score",
      stage: "Where it started",
      degree: "10th Standard",
      school: "S.S.D.V. Dnyanpeeth, Khamgaon",
      score: "67.8%",
      points: [],
    },
  ],

  experience: [
    {
      role: "Industrial Trainee",
      org: "Transformer Repair & Maintenance Company",
      duration: "4 Weeks",
      points: [
        "Gained hands-on exposure to transformer repair and routine maintenance work.",
        "Observed transformer construction, including core, windings, and insulation.",
        "Learned how faults are inspected and how transformers are tested after repair.",
        "Followed workshop practices and safety discipline in an industrial environment.",
        "Understood the importance of preventive maintenance in keeping electrical equipment reliable.",
      ],
    },
  ],

  projects: [
    {
      name: "Automatic Street Light Controller",
      demo: "street",
      filters: ["automation", "energy"],
      tags: ["LDR", "Energy saving", "Automation"],
      objective:
        "To automatically control street lights based on ambient light and avoid unnecessary power use.",
      concept:
        "An LDR (Light Dependent Resistor) senses surrounding light intensity. When daylight falls at dusk, the circuit switches the street light ON, and it switches OFF again at dawn.",
      benefit: "Reduces energy consumption and the need for manual operation.",
    },
    {
      name: "Home Automation Using AI",
      demo: "home",
      filters: ["ai", "automation", "energy"],
      tags: ["AI", "Smart home", "Efficiency"],
      objective: "To explore an AI-integrated system for controlling and monitoring home appliances.",
      concept: "Appliances are controlled and monitored automatically, improving user convenience.",
      benefit: "Supports better energy-use efficiency by reducing wasted power.",
    },
  ],

  skills: [
    {
      group: "Core Subjects",
      items: [
        "Electrical engineering fundamentals",
        "Basic electrical machines",
        "Control systems",
        "Electrical measurements & instrumentation",
      ],
    },
    {
      group: "Practical Exposure",
      items: ["Transformer repair", "Maintenance", "Fault inspection", "Testing (4-week training)"],
    },
    { group: "Software", items: ["MS Word", "MATLAB (basic)"] },
    { group: "Languages", items: ["English", "Hindi", "Marathi"] },
  ],

  interests: [
    "Electrical machines and transformers",
    "Power and energy efficiency",
    "Automation and control systems",
    "Equipment maintenance and reliability",
  ],

  professionalSkills: [
    { name: "Problem-solving", text: "Break down technical problems and work towards practical solutions." },
    { name: "Teamwork & communication", text: "Work well in groups and explain ideas clearly." },
    { name: "Time management", text: "Balance coursework, projects, and training schedules." },
    { name: "Adaptability", text: "Quick to learn new tools, processes, and work environments." },
  ],

  additional: { Languages: "English, Hindi, Marathi", Nationality: "Indian" },

  marquee: [
    "Electrical machines",
    "Control systems",
    "Transformers",
    "Automation",
    "Energy efficiency",
    "Measurements & instrumentation",
    "MATLAB",
    "Maintenance",
  ],
};

// Default look of the site (the owner can change these on their own device via the Customise panel)
window.SITE_DEFAULTS = {
  accent: "#ff2a2a",
  motion: true,
  hidden: [],
};
