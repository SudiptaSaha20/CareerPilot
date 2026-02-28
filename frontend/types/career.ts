export interface ResumeData {
  score: number;
  improvementScore: number;
  matchPercentage: number;
  skills: string[];
  skillGaps: string[];
  strengths: string[];
  experience: { title: string; company: string; years: number }[];
  education: { degree: string; school: string; year: number }[];
  suggestions: { title: string; description: string }[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface InterviewFeedback {
  communication: number;
  technical: number;
  confidence: number;
  overall: number;
}

export interface MarketRole {
  id: string;
  title: string;
  matchPercentage: number;
  salaryRange: string;
  demandLevel: 'High' | 'Medium' | 'Low';
  company?: string;
}

export interface MarketTrend {
  month: string;
  demand: number;
  salary: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  type: 'resume' | 'interview' | 'market' | 'report';
}

export interface DashboardStats {
  resumeScore: number;
  skillMatch: number;
  interviewReadiness: number;
  marketDemand: number;
}
