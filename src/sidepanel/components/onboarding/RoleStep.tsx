import { useState } from 'react';
import { Check } from 'lucide-react';
import type { UserRole } from '../../../types/persona';
import { formatRole } from '../../../types/persona';

interface RoleStepProps {
  initialRole?: UserRole;
  initialCustomRole?: string;
  onNext: (role: UserRole, customRole?: string) => void;
  onBack: () => void;
}

export function RoleStep({
  initialRole = 'student',
  initialCustomRole,
  onNext,
  onBack,
}: RoleStepProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [customRole, setCustomRole] = useState<string>(initialCustomRole || '');

  const roles: UserRole[] = [
    'student',
    'junior_developer',
    'mid_developer',
    'senior_developer',
    'tech_lead',
    'architect',
    'other',
  ];

  const handleNext = () => {
    if (selectedRole === 'other' && !customRole.trim()) {
      alert('Please enter your role');
      return;
    }
    onNext(selectedRole, selectedRole === 'other' ? customRole : undefined);
  };

  return (
    <div className="p-10 flex flex-col gap-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Step 1 of 4: What's your role?
        </h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div className="bg-primary-500 dark:bg-primary-400 h-2 rounded-full transition-all duration-300 w-1/4"></div>
        </div>

        <div className="flex flex-col gap-2">
          {roles.map((role) => (
            <label
              key={role}
              className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                  className="w-4 h-4 text-primary-500 border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatRole(role)}
                </span>
              </div>
              {selectedRole === role && (
                <Check className="w-5 h-5 text-primary-500 dark:text-primary-400" />
              )}
            </label>
          ))}
        </div>

        {selectedRole === 'other' && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Enter your role"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
