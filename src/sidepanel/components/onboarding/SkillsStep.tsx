import React, { useState } from 'react';
import { Plus, X, Lightbulb } from 'lucide-react';
import type { TechSkill, SkillLevel } from '../../../types/persona';
import { generateUUID } from '../../../types/persona';

interface SkillsStepProps {
  initialSkills?: TechSkill[];
  onNext: (skills: TechSkill[]) => void;
  onBack: () => void;
}

export function SkillsStep({ initialSkills = [], onNext, onBack }: SkillsStepProps) {
  const [skills, setSkills] = useState<TechSkill[]>(initialSkills);
  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = () => {
    const skillName = skillInput.trim();
    if (!skillName) return;

    // Check for duplicates
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      alert('Skill already added');
      return;
    }

    const now = new Date().toISOString();
    const newSkill: TechSkill = {
      id: generateUUID(),
      name: skillName,
      level: 'beginner',
      confidence: 3,
      addedAt: now,
      lastUsed: now,
      timesEncountered: 0,
    };

    setSkills([...skills, newSkill]);
    setSkillInput('');
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter((s) => s.id !== id));
  };

  const handleUpdateLevel = (id: string, level: SkillLevel) => {
    setSkills(skills.map((s) => (s.id === id ? { ...s, level } : s)));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSkill();
    }
  };

  return (
    <div className="p-10 flex flex-col gap-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Step 2 of 4: Add your tech skills
        </h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div className="bg-primary-500 dark:bg-primary-400 h-2 rounded-full transition-all duration-300 w-1/2"></div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type to add a skill:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., JavaScript, React, Docker"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Your Skills:
            </p>
            <div className="flex flex-col gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">
                    {skill.name}
                  </span>
                  <SkillLevelPicker
                    level={skill.level}
                    onChange={(level) => handleUpdateLevel(skill.id, level)}
                  />
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                    aria-label="Remove skill"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Add 3-5 key skills to get the best experience
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
        <button
          onClick={() => onNext(skills)}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

interface SkillLevelPickerProps {
  level: SkillLevel;
  onChange: (level: SkillLevel) => void;
}

function SkillLevelPicker({ level, onChange }: SkillLevelPickerProps) {
  const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex items-center gap-1">
        {levels.map((lvl, idx) => {
          const currentIndex = levels.indexOf(level);
          const isActive = idx <= currentIndex;

          return (
            <button
              key={lvl}
              className={`
                w-3 h-3 rounded-full transition-all cursor-pointer
                ${
                  isActive
                    ? 'bg-primary-500 dark:bg-primary-400 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }
              `}
              onClick={() => onChange(lvl)}
              title={lvl}
              aria-label={`Set skill level to ${lvl}`}
            />
          );
        })}
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize min-w-[90px]">
        {level}
      </span>
    </div>
  );
}
