import { useState } from 'react';
import { Brain, TrendingUp, RefreshCw, Lock } from 'lucide-react';

interface WelcomeStepProps {
  initialName?: string;
  onNext: (name?: string) => void;
  onSkip: () => void;
  isEditMode?: boolean;
}

export function WelcomeStep({ initialName, onNext, onSkip, isEditMode }: WelcomeStepProps) {
  const [name, setName] = useState(initialName || '');

  return (
    <div className="p-10 flex flex-col gap-6">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
          Welcome to DocuMentor AI! 👋
        </h1>

        <p className="text-center text-gray-600 dark:text-gray-400 text-lg mb-6 leading-relaxed">
          Your AI-powered learning companion for technical documentation
        </p>

        <div className="mb-6">
          <label
            htmlFor="user-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            What should we call you? (Optional)
          </label>
          <input
            id="user-name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Brain className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Remembers your tech stack and skill levels
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Tracks your learning progress</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <RefreshCw className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Syncs across all your devices</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Lock className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Complete control over your data
            </span>
          </div>
        </div>

        <p className="text-center text-primary-600 dark:text-primary-400 font-semibold">
          Let's personalize your experience in 4 steps (takes ~2 minutes)
        </p>
      </div>

      <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSkip}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          {isEditMode ? 'Cancel' : 'Skip for now'}
        </button>
        <button
          onClick={() => onNext(name.trim() || undefined)}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Let's get started →
        </button>
      </div>
    </div>
  );
}
