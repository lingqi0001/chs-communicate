const PORTFOLIO_DATA = {
  profile: {
    name: "Application Hub",
    targetMajor: "Human-Computer Interaction (HCI)",
    focus: "Tech-focused with UI/UX Integration",
    gpa: {
      unweighted: 3.76, // Estimated cumulative GPA based on most likely G11 2B5A scenario
      weighted: 3.93,
      credits: 25.75,
      history: [
        { grade: "9th", uw: 3.85, w: 0, credits: 12.75 },
        { grade: "10th", uw: 3.71, w: 3.86, credits: 13.00 } // Calculated to match cumulative
      ]
    }
  },
  
  projects: [
    {
      id: "personal-web",
      title: "Personal Portfolio Website",
      category: "tech",
      tags: ["HTML/CSS/JS", "HCI Portfolio", "Responsive Design"],
      description: "Designed and built a custom, agency-free portfolio from scratch to showcase academic projects and UX research work.",
      highlights: [
        "Rejects generic template frameworks for a unique, personalized expression",
        "Implements premium micro-interactions and dark-mode aesthetic"
      ]
    },
    {
      id: "usaco",
      title: "USACO Bronze Division promotion",
      category: "tech",
      tags: ["Algorithms", "C++ / Java", "Competitive Programming"],
      description: "Successfully promoted to Bronze level in the USACO (USA Computing Olympiad) testing algorithmic problem solving.",
      highlights: [
        "Advanced through initial levels demonstrating strong foundation in computing foundations",
        "Applied logic structures similar to Advanced Object Oriented Design (GT)"
      ]
    },
    {
      id: "tianhe-ux",
      title: "Fashion Tianhe Signage System Optimization",
      category: "ux",
      tags: ["Wayfinding Systems", "User Research", "Interaction Prototyping"],
      description: "A comprehensive UX case study investigating the complex wayfinding system of Guangzhou's largest underground mall, Fashion Tianhe.",
      highlights: [
        "Conducting user observations and task tests to document navigation failure points",
        "Developing a revised layout prototype to improve wayfinding and spatial navigation",
        "Target completion: July 30, including iterative feedback loops"
      ]
    },
    {
      id: "gz-traffic-video",
      title: "Guangzhou Congestion: Are Electric Scooters to Blame?",
      category: "ux",
      tags: ["Urban Sociology", "Data Analysis", "Bilibili Video Essay"],
      description: "A popular science video essay mapping urban space usage and social behaviors in relation to traffic congestion, gaining 50,000+ views on Bilibili.",
      highlights: [
        "Analyzed spatial conflicts between micro-mobility vehicles and pedestrians",
        "Created custom visualizations to explain complex urban dynamics to the general public"
      ]
    },
    {
      id: "youth-league-video",
      title: "Youth League Recruitment Motivation Study",
      category: "humanities",
      tags: ["Social Research", "Qualitative Survey", "Bilibili Video Essay"],
      description: "A sociological research video essay examining the underlying motivations of high school students joining the Communist Youth League, reaching 100,000+ views on Bilibili.",
      highlights: [
        "Conducted student interviews and analyzed patterns of motivation and institutional participation",
        "Synthesized findings into an accessible video format that went viral in the student community"
      ]
    },
    {
      id: "script-killing-intern",
      title: "MBTI Match & Romance Index AI Model Design",
      category: "leadership",
      tags: ["Product Design", "User Psychology", "AI Framework", "Cross-team Leadership"],
      description: "Interned at an innovative script-killing company targeting young demographics. Structured MBTI and matchmaking analytics models.",
      highlights: [
        "Designed the analysis logical framework to infer player MBTI & dating risk indexes from gameplay choices",
        "Collaborated with and guided the data science/AI team to deploy the analytical engine",
        "Optimized onboarding and user psychology alignment to boost matching success rate"
      ]
    },
    {
      id: "xia-zao-film",
      title: "Short Film: 'Summer Noise' (夏噪)",
      category: "leadership",
      tags: ["Directing", "Project Coordination", "Cinematography"],
      description: "Directed an atmospheric short film, coordinating schedules, cinematography, and logistics across school departments. Gained 70,000+ online views.",
      highlights: [
        "Organized 1-week screening event on campus big screens, reaching 5,000+ students and visitors",
        "Managed cross-functional student crew (sound, acting, post-production) under tight deadlines"
      ]
    },
    {
      id: "chschat-xyz",
      title: "CHSchat.xyz - Centennial HS Hub",
      category: "leadership",
      tags: ["Web Dev", "Custom Tools", "Campus Media"],
      description: "Developed and launched CHSchat.xyz, a customized hub integrating utility tools, school news, and communication tools for Centennial High School.",
      highlights: [
        "Created a unified dashboard for student life and resource sharing",
        "Custom utility tools designed to match the high school student workflow"
      ]
    },
    {
      id: "tedx-organizer",
      title: "TEDx Youth Event Organizer",
      category: "other",
      tags: ["Event Planning", "Licensing", "Public Speaking"],
      description: "Leading the licensing, speaker curation, and event execution of a TEDx youth event planned for December 2026.",
      highlights: [
        "Managing licensing applications with TED organization in New York",
        "Coordinating team structures and venue logistics ahead of the event"
      ]
    }
  ],

  courses: {
    g10g11: [
      { name: "American Government-Honor", grade: "A", level: "Honor" },
      { name: "Independent Research-GT", grade: "A", level: "GT" },
      { name: "Advance Object Oriented Design-GT", grade: "A", level: "GT" },
      { name: "English-Honor", grade: "B", level: "Honor" },
      { name: "Video Production-GT", grade: "A", level: "GT" },
      { name: "AP Psychology", grade: "A (AP 4-5 Target, G10 Score: 4)", level: "AP / GT" },
      { name: "AP Calculus BC", grade: "B (AP 5 Target, G10 Score: 3)", level: "AP" },
      { name: "AP Computer Science A", grade: "AP 4-5 Target (Self-study, G10 Score: 3)", level: "AP" },
      { name: "AP Micro Economics", grade: "AP 4/5 (G10 Result)", level: "AP" }
    ],
    g12: [
      { name: "AP Statistics", detail: "HCC college credit alternative option", expected: "A", status: "Planned" },
      { name: "Advance Topic in CS – G/T", detail: "CS continuation track", expected: "A", status: "Planned" },
      { name: "English 12 - Hon", detail: "Senior English requirement", expected: "A", status: "Planned" },
      { name: "Sports for Life", detail: "Physical education elective", expected: "A", status: "Planned" },
      { name: "Law and the Citizen", detail: "Social sciences elective", expected: "A", status: "Planned" },
      { name: "AP Physics I", detail: "Scientific reasoning requirement", expected: "B-A", status: "Planned" }
    ]
  },

  toefl: [
    { date: "Current Best (Dec 2025)", r: 24, l: 26, s: 26, w: 24, total: 102 },
    { date: "Expected (Sept 2026)", r: 25, l: 27, s: 27, w: 27, total: "108-110", target: true }
  ],

  volunteering: [
    { name: "生物岛小洲村: 环保宣传", hours: 7 },
    { name: "中共三大会议旧址纪念馆: 志愿者服务", hours: 4 },
    { name: "爱尔眼科诊所爱眼小驿站", hours: 3 },
    { name: "工行广州骏景支行: 反诈宣传", hours: 3 },
    { name: "北师大广实学校：体育嘉年华志愿者", hours: 10 },
    { name: "龙湖街图书馆：志愿服务", hours: 4 },
    { name: "花城驿站：环保宣传", hours: 4 },
    { name: "Other Community Services (Accumulated)", hours: 65 }
  ],

  milestones: [
    { date: "June 25, 2026", task: "Complete research questions, target users, metrics, and sample sizes for core studies." },
    { date: "June 30, 2026", task: "Publish the initial v1 of the personal portfolio website." },
    { date: "July 30, 2026", task: "Finalize the Fashion Tianhe wayfinding case study (testing & interactive demo)." },
    { date: "July 30, 2026", task: "Complete anonymization and system logs write-up for the script-killing MBTI project." },
    { date: "September 30, 2026", task: "Take the final TOEFL exam aiming for 108+." },
    { date: "December 2026", task: "Host TEDx Centennial High School Youth Event (pending license approval)." }
  ]
};
