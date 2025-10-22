import { User, Edit2 } from 'lucide-react';
import type { UserPersona } from '../../../types/persona';
import { formatRole, formatLearningStyle } from '../../../types/persona';

interface ProfileSectionProps {
  persona: UserPersona;
  onEditPersona: () => void;
}

export function ProfileSection({ persona, onEditPersona }: ProfileSectionProps) {
  return (
    <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Profile</h3>
        </div>
        <button
          onClick={onEditPersona}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {persona.profile.name && (
          <p className="text-gray-900 dark:text-gray-100 font-medium">👋 {persona.profile.name}</p>
        )}
        <p className="text-gray-700 dark:text-gray-300">
          {formatRole(persona.profile.role, persona.profile.customRole)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {persona.skills.length} skills • {persona.learningGoals.length} goals •{' '}
          {persona.usage.totalDocsAnalyzed} docs analyzed
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Learning style: {formatLearningStyle(persona.preferredLearningStyle)}
        </p>
      </div>

      {persona.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills:</p>
          <div className="flex flex-wrap gap-2">
            {persona.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-sm rounded-full border border-primary-200 dark:border-primary-800"
              >
                {skill.name} ({skill.level})
              </span>
            ))}
          </div>
        </div>
      )}

      {persona.learningGoals.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Learning goals:
          </p>
          <ul className="space-y-1">
            {persona.learningGoals.map((goal) => (
              <li
                key={goal.id}
                className={`text-sm ${
                  goal.completed
                    ? 'text-gray-500 dark:text-gray-500 line-through'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {goal.completed ? '✓' : '•'} {goal.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
