import { useState } from 'react';
import { Video, BookOpen, Wrench, Sparkles, Check, PartyPopper } from 'lucide-react';
import type { LearningStyle } from '../../../types/persona';

interface StyleStepProps {
  initialStyle?: LearningStyle;
  onFinish: (style: LearningStyle) => void;
  onBack: () => void;
}

export function StyleStep({ initialStyle = 'mixed', onFinish, onBack }: StyleStepProps) {
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle>(initialStyle);

  const styles: Array<{
    value: LearningStyle;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }> = [
    {
      value: 'visual',
      icon: Video,
      title: 'Visual learner',
      description: 'I prefer videos, diagrams, and infographics',
    },
    {
      value: 'reading',
      icon: BookOpen,
      title: 'Reading learner',
      description: 'I prefer articles, docs, and written content',
    },
    {
      value: 'hands_on',
      icon: Wrench,
      title: 'Hands-on learner',
      description: 'I prefer code examples and interactive tutorials',
    },
    {
      value: 'mixed',
      icon: Sparkles,
      title: 'Mixed learner',
      description: 'I like all of the above!',
    },
  ];

  return (
    <div className="p-10 flex flex-col gap-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Step 4 of 4: How do you prefer to learn?
        </h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div className="bg-primary-500 dark:bg-primary-400 h-2 rounded-full transition-all duration-300 w-full"></div>
        </div>

        <div className="flex flex-col gap-3">
          {styles.map((style) => {
            const IconComponent = style.icon;
            const isSelected = selectedStyle === style.value;

            return (
              <label
                key={style.value}
                className={`
                  flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors
                  ${
                    isSelected
                      ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="learningStyle"
                  value={style.value}
                  checked={isSelected}
                  onChange={() => setSelectedStyle(style.value)}
                  className="sr-only"
                />
                <div
                  className={`
                  flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                  ${
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }
                `}
                >
                  <IconComponent
                    className={`
                    w-6 h-6
                    ${
                      isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className={`
                    font-semibold mb-1
                    ${
                      isSelected
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }
                  `}
                  >
                    {style.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {style.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-6 h-6 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={() => onFinish(selectedStyle)}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          Finish!
          <PartyPopper className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
