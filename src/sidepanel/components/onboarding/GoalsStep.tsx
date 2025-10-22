import React, { useState } from 'react';
import { Plus, X, Target, Lightbulb } from 'lucide-react';
import type { LearningGoal } from '../../../types/persona';
import { generateUUID } from '../../../types/persona';

interface GoalsStepProps {
  initialGoals?: LearningGoal[];
  onNext: (goals: LearningGoal[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function GoalsStep({ initialGoals = [], onNext, onBack, onSkip }: GoalsStepProps) {
  const [goals, setGoals] = useState<LearningGoal[]>(initialGoals);
  const [goalInput, setGoalInput] = useState('');

  const handleAddGoal = () => {
    const goalTitle = goalInput.trim();
    if (!goalTitle) return;

    // Check for duplicates
    if (goals.some((g) => g.title.toLowerCase() === goalTitle.toLowerCase())) {
      alert('Goal already added');
      return;
    }

    const now = new Date().toISOString();
    const newGoal: LearningGoal = {
      id: generateUUID(),
      title: goalTitle,
      relatedSkills: [], // Will be populated later with AI
      createdAt: now,
      completed: false,
      progress: 0,
    };

    setGoals([...goals, newGoal]);
    setGoalInput('');
  };

  const handleRemoveGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddGoal();
    }
  };

  return (
    <div className="p-10 flex flex-col gap-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Step 3 of 4: What are you learning?{' '}
          <span className="text-gray-500 dark:text-gray-400 text-lg">(Optional)</span>
        </h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div className="bg-primary-500 dark:bg-primary-400 h-2 rounded-full transition-all duration-300 w-3/4"></div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add learning goals to get personalized insights as you read docs
        </p>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Master React Hooks, Learn Docker"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
            />
            <button
              onClick={handleAddGoal}
              className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Goals:</p>
            <ul className="flex flex-col gap-2">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <Target className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                  <span className="flex-1 text-gray-900 dark:text-gray-100">{goal.title}</span>
                  <button
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                    aria-label="Remove goal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            We'll track your progress as you read docs
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Skip this step
          </button>
          <button
            onClick={() => onNext(goals)}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
