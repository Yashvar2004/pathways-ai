export type ResourceType = "article" | "video" | "documentation" | "tool";

export interface SearchResult {
  topicId: number;
  query: string;
  resources: ResourceItem[];
  courses: CourseItem[];
}

export interface ResourceItem {
  id: number;
  title: string;
  url: string;
  description: string | null;
  type: ResourceType;
  isFree: boolean;
}

export interface CourseItem {
  id: number;
  title: string;
  description: string | null;
  provider: string | null;
  url: string | null;
  isFree: boolean;
  isPathwaysGenerated: boolean | null;
}

export interface ModuleItem {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  sortOrder: number;
  completed?: boolean;
}

export interface AssessmentQuestion {
  id: number;
  questionText: string;
  options: string[];
}

export interface QuizResult {
  passed: boolean;
  score: number;
  passingScore: number;
  attemptsRemaining: number;
  certificateId?: number;
}

export interface UsageInfo {
  searchCount: number;
  searchLimit: number;
  searchesRemaining: number;
  certificationCount: number;
  certificationLimit: number;
  certificationsRemaining: number;
  isSubscribed: boolean;
}
