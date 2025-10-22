// User Persona System - Type Definitions
// Version 1.0

export interface UserPersona {
  version: string; // "1.0" - for future migrations
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // User Profile
  profile: UserProfile;

  // Skills & Knowledge
  skills: TechSkill[];

  // Learning Context
  learningGoals: LearningGoal[];
  preferredLearningStyle: LearningStyle;

  // Usage Analytics (privacy-safe, local only)
  usage: UsageStats;

  // AI Suggestions
  suggestedUpdates: PersonaUpdate[];
}

export interface UserProfile {
  name?: string; // Optional friendly name
  role: UserRole;
  yearsOfExperience?: number;
  customRole?: string; // If role === 'other'
}

export type UserRole =
  | 'student'
  | 'junior_developer' // 0-2 years
  | 'mid_developer' // 2-5 years
  | 'senior_developer' // 5+ years
  | 'tech_lead'
  | 'architect'
  | 'other';

export interface TechSkill {
  id: string; // UUID
  name: string; // "JavaScript", "React", "Docker"
  category?: SkillCategory;
  level: SkillLevel;
  confidence: number; // 1-5, auto-calculated from usage
  addedAt: string; // ISO timestamp
  lastUsed: string; // ISO timestamp
  timesEncountered: number; // How many docs analyzed with this skill
}

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'tool'
  | 'concept'
  | 'platform'
  | 'other';

export type SkillLevel =
  | 'beginner' // Learning fundamentals
  | 'intermediate' // Comfortable with basics, learning advanced
  | 'advanced' // Deep knowledge, can handle complex topics
  | 'expert'; // Mastery level

export interface LearningGoal {
  id: string; // UUID
  title: string; // "Master React Hooks"
  relatedSkills: string[]; // Array of skill IDs
  createdAt: string;
  targetDate?: string; // Optional deadline
  completed: boolean;
  completedAt?: string;
  progress: number; // 0-100, auto-calculated
}

export type LearningStyle =
  | 'visual' // Prefers videos, diagrams, infographics
  | 'reading' // Prefers text, articles, documentation
  | 'hands_on' // Prefers tutorials, code examples, practice
  | 'mixed'; // No strong preference

export interface UsageStats {
  totalDocsAnalyzed: number;
  topicsExplored: TopicHistory[];
  lastActiveDate: string;
  firstUseDate: string;
  skillLevelUps: SkillLevelUpHistory[];
}

export interface TopicHistory {
  topic: string;
  count: number;
  lastAccessed: string;
  averageSuitability: number; // 0-1, how often docs match user level
}

export interface SkillLevelUpHistory {
  skillName: string;
  fromLevel: SkillLevel;
  toLevel: SkillLevel;
  date: string;
  automatic: boolean; // AI-suggested vs manual update
}

export interface PersonaUpdate {
  id: string; // UUID
  type: UpdateType;
  title: string; // "Level up React to Advanced?"
  description: string; // Detailed reasoning
  suggestedChanges: Partial<UserPersona>;
  triggeredBy: UpdateTrigger;
  createdAt: string;
  status: UpdateStatus;
  appliedAt?: string;
}

export type UpdateType =
  | 'skill_level_up' // Upgrade skill level
  | 'new_skill_detected' // Add new skill to profile
  | 'goal_progress' // Update goal progress/completion
  | 'goal_suggestion'; // Suggest new learning goal

export type UpdateStatus =
  | 'pending' // Waiting for user action
  | 'accepted' // User applied the suggestion
  | 'dismissed'; // User rejected the suggestion

export interface UpdateTrigger {
  reason: string;
  evidence: {
    docsAnalyzed: number;
    topicName: string;
    currentLevel?: SkillLevel;
    suggestedLevel?: SkillLevel;
  };
}

// Utility function to generate UUIDs
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Utility function to format role for display
export function formatRole(role: UserRole, customRole?: string): string {
  if (role === 'other' && customRole) {
    return customRole;
  }

  const roleMap: Record<UserRole, string> = {
    student: 'Student / Learning to Code',
    junior_developer: 'Junior Developer (0-2 years)',
    mid_developer: 'Mid-level Developer (2-5 years)',
    senior_developer: 'Senior Developer (5+ years)',
    tech_lead: 'Tech Lead',
    architect: 'Architect',
    other: 'Other',
  };

  return roleMap[role] || role;
}

// Utility function to format learning style for display
export function formatLearningStyle(style: LearningStyle): string {
  const styleMap: Record<LearningStyle, string> = {
    visual: 'Visual learner',
    reading: 'Reading learner',
    hands_on: 'Hands-on learner',
    mixed: 'Mixed learner',
  };

  return styleMap[style] || style;
}
