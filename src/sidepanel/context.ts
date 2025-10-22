// User Persona Context Module
// Handles persona data access and formatting for AI system prompts

import { loadPersona } from './persona-storage';
import type { TechSkill, LearningGoal } from '../types/persona';
import { formatRole, formatLearningStyle } from '../types/persona';

/**
 * Get a concise summary of the user's persona for AI system prompts
 * Returns a formatted string containing role, skills, goals, and learning style
 */
export async function getPersonaSummary(): Promise<string> {
  const persona = await loadPersona();

  // Handle missing persona
  if (!persona) {
    return 'No user persona configured. Using general learning assistance mode.';
  }

  const sections: string[] = [];

  // 1. Role & Experience
  const roleText = formatRole(persona.profile.role, persona.profile.customRole);
  let roleSection = `The user is a ${roleText}`;
  if (persona.profile.yearsOfExperience !== undefined) {
    roleSection += ` (${persona.profile.yearsOfExperience} years of experience)`;
  }
  sections.push(roleSection);

  // 2. Skills Summary (top 5-7 skills, prioritize higher levels)
  if (persona.skills.length > 0) {
    const topSkills = getTopSkills(persona.skills, 7);
    const skillsText = topSkills.map((skill) => `${skill.name} (${skill.level})`).join(', ');
    sections.push(`with these main technical skills: ${skillsText}.`);
  }

  // 3. Learning Goals (active only)
  const activeGoals = persona.learningGoals.filter((goal) => !goal.completed);
  if (activeGoals.length > 0) {
    const goalsText = activeGoals.map((goal) => formatLearningGoal(goal)).join('; ');
    sections.push(`Their current learning goals are: ${goalsText}.`);
  }

  // 4. Learning Style
  const learningStyleText = formatLearningStyle(persona.preferredLearningStyle);
  sections.push(`And their preferred learning style is: ${learningStyleText}.`);

  return sections.join('\n');
}

/**
 * Get top N skills, prioritized by level (expert > advanced > intermediate > beginner)
 * Within same level, sort by most recently used
 */
function getTopSkills(skills: TechSkill[], limit: number): TechSkill[] {
  const levelPriority: Record<string, number> = {
    expert: 4,
    advanced: 3,
    intermediate: 2,
    beginner: 1,
  };

  return [...skills]
    .sort((a, b) => {
      // First sort by level priority
      const levelDiff = levelPriority[b.level] - levelPriority[a.level];
      if (levelDiff !== 0) return levelDiff;

      // Then by last used (most recent first)
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    })
    .slice(0, limit);
}

/**
 * Format a learning goal for display in summary
 */
function formatLearningGoal(goal: LearningGoal): string {
  let text = goal.title;
  if (goal.targetDate) {
    const targetDate = new Date(goal.targetDate);
    const formattedDate = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    text += ` (target: ${formattedDate})`;
  }
  return text;
}
