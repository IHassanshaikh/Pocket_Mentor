// ============================================================
// APP CONSTANTS
// ============================================================

export const APP_NAME = 'Pocket Mentor';
export const APP_VERSION = '1.0.0';

// Conversation Modes
export const MODES = {
  CASUAL: {
    id: 'casual',
    name: 'Casual Friend',
    icon: 'modeCasual',
    color: '#f59e0b',
    description: 'Practice daily conversation — weekend plans, movies, tech, travel.',
    tags: ['Weekend Plans', 'Movies', 'Food', 'Travel', 'Sports', 'Tech'],
    systemContext: 'casual friendly conversation',
  },
  TECH_INTERVIEW: {
    id: 'tech_interview',
    name: 'Tech Interview',
    icon: 'modeTech',
    color: '#6366f1',
    description: 'AI becomes your interviewer. Practice behavioral and technical questions.',
    tags: ['Tell Me About Yourself', 'System Design', 'React', 'Node.js', 'Projects'],
    systemContext: 'technical software engineering interview',
  },
  CLIENT_MEETING: {
    id: 'client_meeting',
    name: 'Client Meeting',
    icon: 'modeClient',
    color: '#06b6d4',
    description: 'Practice with an American client — requirements, sprints, deadlines.',
    tags: ['Requirements', 'Sprint Planning', 'Bug Discussion', 'Deadlines'],
    systemContext: 'client meeting with an American client',
  },
  HR_INTERVIEW: {
    id: 'hr_interview',
    name: 'HR Interview',
    icon: 'modeHr',
    color: '#8b5cf6',
    description: 'Behavioral questions, salary negotiation, strengths and weaknesses.',
    tags: ['Behavioral', 'Salary', 'Strengths', 'Weaknesses', 'Conflict'],
    systemContext: 'HR behavioral interview',
  },
  SALES_CALL: {
    id: 'sales_call',
    name: 'Sales Call',
    icon: 'modeSales',
    color: '#ec4899',
    description: 'Practice convincing potential customers naturally and confidently.',
    tags: ['Pitching', 'Objection Handling', 'Closing', 'Value Proposition'],
    systemContext: 'sales call with a potential customer',
  },
  OFFICE_CHAT: {
    id: 'office_chat',
    name: 'Office Small Talk',
    icon: 'modeOffice',
    color: '#22c55e',
    description: 'Coffee break conversations, networking, introductions, coffee shops.',
    tags: ['Coffee Break', 'Networking', 'Introductions', 'Conference'],
    systemContext: 'casual office small talk',
  },
};

// AI Personalities
export const PERSONALITIES = {
  SOFTWARE_ENGINEER: {
    id: 'software_engineer',
    name: 'Jake Mitchell',
    role: 'Software Engineer',
    icon: 'personalityEngineer',
    color: '#6366f1',
    description: 'Casual, uses tech slang, loves discussing code.',
    traits: 'casual, friendly, uses American tech slang like "ship it", "LGTM", "let\'s circle back"',
  },
  ENGINEERING_MANAGER: {
    id: 'engineering_manager',
    name: 'Sarah Chen',
    role: 'Sr. Engineering Manager',
    icon: 'personalityManager',
    color: '#8b5cf6',
    description: 'Structured, mentoring, asks great follow-ups.',
    traits: 'structured, encouraging, mentoring tone, asks probing follow-up questions',
  },
  STARTUP_FOUNDER: {
    id: 'startup_founder',
    name: 'Alex Rivera',
    role: 'Startup Founder',
    icon: 'personalityFounder',
    color: '#f59e0b',
    description: 'Fast-paced, enthusiastic, loves disruption.',
    traits: 'fast-paced, high energy, enthusiastic, uses startup jargon like "pivot", "MVP", "disrupt"',
  },
  HR_RECRUITER: {
    id: 'hr_recruiter',
    name: 'Emily Brooks',
    role: 'HR Recruiter',
    icon: 'personalityRecruiter',
    color: '#ec4899',
    description: 'Warm, probing, evaluates culture fit.',
    traits: 'warm, empathetic, probing, evaluates personality and culture fit',
  },
  PRODUCT_MANAGER: {
    id: 'product_manager',
    name: 'David Kim',
    role: 'Product Manager',
    icon: 'personalityProduct',
    color: '#06b6d4',
    description: 'Detail-oriented, outcome-focused, data-driven.',
    traits: 'detail-oriented, outcome-focused, speaks about metrics, user stories, OKRs',
  },
  CLIENT: {
    id: 'client',
    name: 'Robert Taylor',
    role: 'Client (VP of Tech)',
    icon: 'personalityClient',
    color: '#22c55e',
    description: 'Demanding but fair, wants results.',
    traits: 'professional, slightly demanding, results-oriented, values clear communication',
  },
  FRIEND: {
    id: 'friend',
    name: 'Mike Johnson',
    role: 'Your American Friend',
    icon: 'personalityFriend',
    color: '#f97316',
    description: 'Relaxed, humorous, talks about everything.',
    traits: 'super relaxed, funny, uses casual American expressions, cracks jokes',
  },
  PROFESSOR: {
    id: 'professor',
    name: 'Dr. James White',
    role: 'CS Professor',
    icon: 'personalityProfessor',
    color: '#a855f7',
    description: 'Academic, thorough, explains with examples.',
    traits: 'academic, thorough, patient, explains concepts with real-world analogies',
  },
  INVESTOR: {
    id: 'investor',
    name: 'Lisa Park',
    role: 'Venture Capitalist',
    icon: 'personalityInvestor',
    color: '#eab308',
    description: 'Sharp, numbers-focused, evaluates pitches.',
    traits: 'sharp, analytical, numbers-focused, asks tough questions about ROI and growth',
  },
};

// Difficulty Levels
export const DIFFICULTY = {
  BEGINNER: { id: 'beginner', name: 'Beginner', description: 'Slower pace, simpler vocabulary' },
  INTERMEDIATE: { id: 'intermediate', name: 'Intermediate', description: 'Natural pace, standard vocabulary' },
  ADVANCED: { id: 'advanced', name: 'Advanced', description: 'Fast pace, complex vocabulary' },
  NATIVE: { id: 'native', name: 'Native-Level', description: 'Full speed, idioms, interruptions' },
};

// Ambient Sounds
export const AMBIENTS = {
  NONE: { id: 'none', name: 'None', icon: 'ambientNone' },
  COFFEE_SHOP: { id: 'coffee_shop', name: 'Coffee Shop', icon: 'ambientCoffee' },
  OFFICE: { id: 'office', name: 'Office', icon: 'ambientOffice' },
  HOME: { id: 'home', name: 'Home Office', icon: 'ambientHome' },
  COWORKING: { id: 'coworking', name: 'Coworking', icon: 'ambientCoworking' },
};

// Filler Words to detect
export const FILLER_WORDS = [
  'umm', 'um', 'uh', 'uhh', 'ah', 'ahh', 'er', 'err',
  'you know', 'like', 'basically', 'actually', 'literally',
  'so yeah', 'i mean', 'kind of', 'sort of', 'right',
];

// Scoring thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 50,
  POOR: 0,
};

// IndexedDB config
export const DB_NAME = 'pocket-mentor-db';
export const DB_VERSION = 1;
export const DB_STORES = {
  SESSIONS: 'sessions',
  MEMORIES: 'memories',
  RECORDINGS: 'recordings',
  PROGRESS: 'progress',
};

// Local Storage keys
export const LS_KEYS = {
  API_KEY: 'pm_gemini_api_key',
  USER_PROFILE: 'pm_user_profile',
  SETTINGS: 'pm_settings',
  ONBOARDED: 'pm_onboarded',
};
