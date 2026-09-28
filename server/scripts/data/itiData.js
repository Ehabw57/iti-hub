/**
 * ITI hierarchy seed data: Branches → Rounds → Tracks.
 *
 * Compiled from ITI's public announcements / academy site and cross-checked
 * secondary sources (see "Branches & Tracks Seed Data Reference" doc).
 * This is realistic seed/demo data, NOT an authoritative live mirror of the
 * official ITI track list — which tracks run in which branch changes every
 * round. Everything here is admin-editable after seeding.
 *
 * Patterns modeled after the real ITI setup:
 *  - 5 consistently cited core branches (+ Nozha as a 6th core/admin office)
 *  - Extension branches = partner "Digital Egypt Creativity Centers" that
 *    rotate per round and run a small subset of high-demand tracks
 *  - Core branches: 5-8 tracks per active round
 *  - Extension branches: 1-3 tracks per active round
 */

// ---------------------------------------------------------------------------
// Track catalog (name → { category, description }).
// Track names stay free-text/admin-editable in the DB; this catalog is only
// used to seed realistic names + descriptions.
// ---------------------------------------------------------------------------
const ITI_TRACK_CATALOG = {
  // --- Web Development ---
  'Full Stack Web Development (MEARN)': {
    category: 'Web Development',
    description: 'MongoDB, Express, Angular/React, and Node.js for full-stack JavaScript applications.',
  },
  'Full Stack .NET': {
    category: 'Web Development',
    description: 'C#, ASP.NET Core, SQL Server, and modern front-end frameworks for enterprise web apps.',
  },
  'Front-End Development': {
    category: 'Web Development',
    description: 'HTML, CSS, JavaScript, and modern frameworks (React/Angular) for responsive user interfaces.',
  },

  // --- Software Development ---
  'Software Engineering Fundamentals (SWE)': {
    category: 'Software Development',
    description: 'Core software engineering skills: programming fundamentals, data structures, algorithms, and the software development lifecycle.',
  },
  'Software Development (SD)': {
    category: 'Software Development',
    description: 'Applied software development with modern languages, tooling, and team delivery practices.',
  },
  'Mobile Application Development': {
    category: 'Software Development',
    description: 'Native and cross-platform mobile apps for Android and iOS.',
  },
  'Cognitive Computing': {
    category: 'Software Development',
    description: 'Cognitive platforms, NLP, and intelligent application development.',
  },

  // --- Digital Arts ---
  'Animation & Motion Graphics': {
    category: 'Digital Arts',
    description: '2D/3D animation, motion graphics, and visual storytelling.',
  },
  '2D/3D Graphics & Modeling': {
    category: 'Digital Arts',
    description: 'Digital art, modeling, texturing, and rendering pipelines.',
  },
  'Game Development': {
    category: 'Digital Arts',
    description: 'Game engines, gameplay programming, and interactive media.',
  },
  'Digital Content Design': {
    category: 'Digital Arts',
    description: 'Digital content creation, multimedia design, and publishing.',
  },

  // --- Infrastructure & Networks ---
  'Cybersecurity': {
    category: 'Infrastructure & Networks',
    description: 'Network security, ethical hacking, and security operations.',
  },
  'Cloud Computing': {
    category: 'Infrastructure & Networks',
    description: 'Cloud platforms, virtualization, CI/CD, and infrastructure as code.',
  },
  'Networking / Infrastructure Essentials': {
    category: 'Infrastructure & Networks',
    description: 'Network administration, routing/switching, and IT infrastructure essentials.',
  },
  'Embedded Systems': {
    category: 'Infrastructure & Networks',
    description: 'Firmware, microcontrollers, and IoT device development.',
  },
  'Digital IC Design': {
    category: 'Infrastructure & Networks',
    description: 'Digital integrated circuit design and verification.',
  },
  'VMware Technology Essentials': {
    category: 'Infrastructure & Networks',
    description: 'Virtualization fundamentals with VMware vSphere and ESXi.',
  },

  // --- Information Systems ---
  'Data Science / AI & Machine Learning': {
    category: 'Information Systems',
    description: 'ML models, deep learning, and applied AI solutions.',
  },
  'Data Analysis': {
    category: 'Information Systems',
    description: 'Data wrangling, visualization, and business intelligence.',
  },
  'Enterprise Resource Planning (ERP)': {
    category: 'Information Systems',
    description: 'ERP systems (SAP/Odoo) and business process integration.',
  },

  // --- Others ---
  'Professional Skills (Technical & Soft Skills)': {
    category: 'Others',
    description: 'Communication, teamwork, and career-readiness skills for IT professionals.',
  },
};


// ---------------------------------------------------------------------------
// Branches with their rounds and per-round track assignment.
// Core branches run two rounds (Round 45 active, Round 46 upcoming);
// extension branches run a single active round with a limited track subset.
// ---------------------------------------------------------------------------
const ITI_BRANCHES = [
  // ------------------------- Core branches -------------------------
  {
    name: 'Smart Village (HQ)',
    type: 'core',
    location: 'Building B148, 28 Km Cairo–Alexandria Desert Rd, 6th of October, Giza',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Full Stack Web Development (MEARN)',
          'Full Stack .NET',
          'Software Engineering Fundamentals (SWE)',
          'Mobile Application Development',
          'Cybersecurity',
          'Cloud Computing',
          'Data Science / AI & Machine Learning',
          'Animation & Motion Graphics',
        ],
      },
      { name: 'Round 46', isActive: false, tracks: [] },
    ],
  },
  {
    name: 'Alexandria',
    type: 'core',
    location: '1 Mahmoud Said St., Shohada Square (Main Post Office Building), Alexandria',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Development (SD)',
          'Full Stack Web Development (MEARN)',
          'Front-End Development',
          'Embedded Systems',
          'Data Analysis',
          'Game Development',
        ],
      },
      { name: 'Round 46', isActive: false, tracks: [] },
    ],
  },
  {
    name: 'Mansoura',
    type: 'core',
    location: 'Inside Mansoura University campus area, Dakahlia',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Full Stack .NET',
          'Mobile Application Development',
          'Data Science / AI & Machine Learning',
          'Networking / Infrastructure Essentials',
        ],
      },
      { name: 'Round 46', isActive: false, tracks: [] },
    ],
  },
  {
    name: 'Assiut',
    type: 'core',
    location: 'Inside Assiut University, Information Network Building, Assiut',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Software Development (SD)',
          'Full Stack Web Development (MEARN)',
          'Embedded Systems',
          'Cybersecurity',
        ],
      },
      { name: 'Round 46', isActive: false, tracks: [] },
    ],
  },
  {
    name: 'Ismailia',
    type: 'core',
    location: 'Suez Canal region, Ismailia (serves Ismailia, Port Said and Suez)',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Full Stack Web Development (MEARN)',
          'Cloud Computing',
          'Data Analysis',
          'Animation & Motion Graphics',
        ],
      },
      { name: 'Round 46', isActive: false, tracks: [] },
    ],
  },
  {
    // 6th core/administrative branch per ITI contact listings
    name: 'Nozha (Cairo)',
    type: 'core',
    location: 'Al Ensherah, Huckstep, El Nozha, Cairo',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Enterprise Resource Planning (ERP)',
          'Data Analysis',
          'Front-End Development',
          'Networking / Infrastructure Essentials',
          'Professional Skills (Technical & Soft Skills)',
        ],
      },
      { name: 'Round 46', isActive: false, tracks: [] },
    ],
  },

  // --------------------- Extension branches ------------------------
  // Partner "Digital Egypt Creativity Centers" — rotate per round, run a
  // limited subset of high-demand tracks.
  {
    name: 'Aswan',
    type: 'extension',
    location: 'Digital Egypt Creativity Center, Aswan',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Full Stack Web Development (MEARN)',
        ],
      },
    ],
  },
  {
    name: 'Qena',
    type: 'extension',
    location: 'Digital Egypt Creativity Center, Qena',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Data Analysis',
        ],
      },
    ],
  },
  {
    name: 'Sohag',
    type: 'extension',
    location: 'Digital Egypt Creativity Center, Sohag',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Full Stack Web Development (MEARN)',
        ],
      },
    ],
  },
  {
    name: 'Minya',
    type: 'extension',
    location: 'Digital Egypt Creativity Center, Minya',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: [
          'Software Engineering Fundamentals (SWE)',
          'Data Analysis',
        ],
      },
    ],
  },
  {
    name: 'Beni Suef',
    type: 'extension',
    location: 'Digital Egypt Creativity Center, Beni Suef',
    rounds: [
      {
        name: 'Round 45',
        isActive: true,
        tracks: ['Software Engineering Fundamentals (SWE)'],
      },
    ],
  },
];

// Community groups (cross-branch specialization groups)
const ITI_GROUPS = [
  { name: '.NET Developers Egypt', specialization: 'Full Stack .NET', description: 'Community for .NET developers across all ITI branches.' },
  { name: 'React & Front-End Guild', specialization: 'Front-End Development', description: 'Front-end engineers sharing React, CSS, and UI knowledge.' },
  { name: 'AI/ML Research Circle', specialization: 'Artificial Intelligence', description: 'Machine learning practitioners and researchers.' },
  { name: 'Cybersecurity Warriors', specialization: 'Cybersecurity', description: 'Security enthusiasts discussing CTFs, tools, and best practices.' },
  { name: 'UI/UX Designers Hub', specialization: 'Design', description: 'Designers sharing portfolios, critiques, and resources.' },
];

// Job board seed postings
const ITI_JOBS = [
  {
    title: 'Junior .NET Developer',
    company: 'Cairo Tech Solutions',
    location: 'Cairo, Egypt',
    description: 'Looking for fresh ITI graduates to join our .NET team. Training provided.',
    tags: ['Full Stack .NET', 'ASP.NET Core'],
    applyUrl: 'https://example.com/jobs/junior-net-developer',
  },
  {
    title: 'Front-End Engineer (React)',
    company: 'Digital Wave',
    location: 'Smart Village, Giza',
    description: 'Build responsive web interfaces with React and TypeScript.',
    tags: ['React', 'Front-End'],
    applyUrl: 'https://example.com/jobs/front-end-react',
  },
  {
    title: 'Machine Learning Intern',
    company: 'AI Labs Egypt',
    location: 'Remote',
    description: 'Hands-on ML internship for ITI AI/ML track graduates.',
    tags: ['AI/ML', 'Python'],
    applyUrl: 'https://example.com/jobs/ml-intern',
  },
];

// Events seed (dates relative to now so they stay upcoming)
const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const ITI_EVENTS = [
  {
    title: 'ITI National Hackathon',
    description: 'A 48-hour cross-branch hackathon bringing together the best ITI talent.',
    location: 'Smart Village, Giza',
    date: daysFromNow(21),
    registerUrl: 'https://example.com/events/iti-hackathon',
  },
  {
    title: 'Career Day: Meet the Employers',
    description: 'Connect with top employers hiring ITI graduates across all specializations.',
    location: 'Smart Village (HQ), Giza',
    date: daysFromNow(35),
    registerUrl: 'https://example.com/events/career-day',
  },
  {
    title: 'AI & Future of Work Seminar',
    description: 'Industry leaders discuss AI trends and the future of tech careers.',
    location: 'Alexandria',
    date: daysFromNow(14),
    registerUrl: 'https://example.com/events/ai-seminar',
  },
];

module.exports = {
  ITI_BRANCHES,
  ITI_TRACK_CATALOG,
  ITI_GROUPS,
  ITI_JOBS,
  ITI_EVENTS,
};