import type { ResumeData, InterviewQuestion, InterviewFeedback, MarketRole, MarketTrend, ActivityItem, DashboardStats } from '@/types/career';

export const mockResumeData: ResumeData = {
  score: 78,
  improvementScore: 85,
  matchPercentage: 72,
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git'],
  skillGaps: ['Kubernetes', 'System Design', 'CI/CD', 'GraphQL', 'Terraform', 'Redis'],
  strengths: ['Strong frontend expertise', 'Good project diversity', 'Solid education background', 'Clean code practices'],
  experience: [
    { title: 'Frontend Engineer', company: 'TechCorp', years: 3 },
    { title: 'Software Developer', company: 'StartupXYZ', years: 2 },
    { title: 'Junior Developer', company: 'WebAgency', years: 1 },
  ],
  education: [
    { degree: 'B.S. Computer Science', school: 'MIT', year: 2019 },
  ],
  suggestions: [
    { title: 'Add quantifiable achievements', description: 'Include metrics like "increased performance by 40%" to strengthen impact statements.' },
    { title: 'Include system design experience', description: 'Highlight any architecture decisions or system design work to target senior roles.' },
    { title: 'Add CI/CD pipeline experience', description: 'Document your experience with deployment automation and continuous integration.' },
    { title: 'Expand cloud certifications', description: 'Consider AWS Solutions Architect or similar certifications to boost credibility.' },
    { title: 'Improve summary section', description: 'Write a compelling 2-3 sentence summary that highlights your unique value proposition.' },
  ],
};

export const mockInterviewQuestions: InterviewQuestion[] = [
  { id: '1', question: 'Explain the difference between useMemo and useCallback in React.', category: 'Technical', difficulty: 'Medium' },
  { id: '2', question: 'How would you design a URL shortening service?', category: 'System Design', difficulty: 'Hard' },
  { id: '3', question: 'Tell me about a time you resolved a conflict on your team.', category: 'Behavioral', difficulty: 'Easy' },
  { id: '4', question: 'What is the event loop in JavaScript?', category: 'Technical', difficulty: 'Medium' },
  { id: '5', question: 'How do you prioritize tasks when everything is urgent?', category: 'Behavioral', difficulty: 'Easy' },
  { id: '6', question: 'Design a real-time chat application architecture.', category: 'System Design', difficulty: 'Hard' },
  { id: '7', question: 'Explain closures in JavaScript with an example.', category: 'Technical', difficulty: 'Easy' },
  { id: '8', question: 'How would you optimize a slow React application?', category: 'Technical', difficulty: 'Medium' },
];

export const mockInterviewFeedback: InterviewFeedback = {
  communication: 82,
  technical: 75,
  confidence: 88,
  overall: 81,
};

export const mockMarketRoles: MarketRole[] = [
  { id: '1', title: 'Frontend Engineer', matchPercentage: 92, salaryRange: '$120k - $180k', demandLevel: 'High' },
  { id: '2', title: 'Fullstack Developer', matchPercentage: 85, salaryRange: '$130k - $200k', demandLevel: 'High' },
  { id: '3', title: 'Product Engineer', matchPercentage: 78, salaryRange: '$140k - $210k', demandLevel: 'Medium' },
  { id: '4', title: 'React Developer', matchPercentage: 95, salaryRange: '$110k - $170k', demandLevel: 'High' },
  { id: '5', title: 'Software Engineer', matchPercentage: 80, salaryRange: '$125k - $195k', demandLevel: 'High' },
  { id: '6', title: 'DevOps Engineer', matchPercentage: 45, salaryRange: '$130k - $190k', demandLevel: 'Medium' },
];

export const mockMarketTrends: MarketTrend[] = [
  { month: 'Sep', demand: 65, salary: 145 },
  { month: 'Oct', demand: 72, salary: 148 },
  { month: 'Nov', demand: 68, salary: 150 },
  { month: 'Dec', demand: 60, salary: 147 },
  { month: 'Jan', demand: 78, salary: 152 },
  { month: 'Feb', demand: 85, salary: 155 },
  { month: 'Mar', demand: 82, salary: 158 },
  { month: 'Apr', demand: 90, salary: 160 },
  { month: 'May', demand: 88, salary: 162 },
  { month: 'Jun', demand: 95, salary: 165 },
  { month: 'Jul', demand: 92, salary: 168 },
  { month: 'Aug', demand: 98, salary: 170 },
];

export const mockActivities: ActivityItem[] = [
  { id: '1', action: 'Resume analyzed and scored', timestamp: '2 hours ago', type: 'resume' },
  { id: '2', action: 'Completed mock interview session', timestamp: '5 hours ago', type: 'interview' },
  { id: '3', action: 'Market analysis updated', timestamp: '1 day ago', type: 'market' },
  { id: '4', action: 'Career report generated', timestamp: '2 days ago', type: 'report' },
  { id: '5', action: 'Skills assessment completed', timestamp: '3 days ago', type: 'resume' },
];

export const mockDashboardStats: DashboardStats = {
  resumeScore: 78,
  skillMatch: 72,
  interviewReadiness: 81,
  marketDemand: 85,
};

export const mockIndustryComparison = [
  { skill: 'React', you: 90, industry: 75 },
  { skill: 'TypeScript', you: 85, industry: 70 },
  { skill: 'Node.js', you: 70, industry: 65 },
  { skill: 'System Design', you: 40, industry: 80 },
  { skill: 'DevOps', you: 35, industry: 60 },
  { skill: 'Python', you: 60, industry: 55 },
];

// Simulated API delay
export const simulateDelay = (ms: number = 1500): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
