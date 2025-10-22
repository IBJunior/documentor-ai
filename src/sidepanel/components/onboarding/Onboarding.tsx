import { useState } from 'react';
import { PartyPopper } from 'lucide-react';
import type {
  UserPersona,
  UserRole,
  TechSkill,
  LearningGoal,
  LearningStyle,
} from '../../../types/persona';
import { WelcomeStep } from './WelcomeStep';
import { RoleStep } from './RoleStep';
import { SkillsStep } from './SkillsStep';
import { GoalsStep } from './GoalsStep';
import { StyleStep } from './StyleStep';
import { savePersona, createMinimalPersona } from '../../persona-storage';

interface OnboardingProps {
  onComplete: (persona: UserPersona) => void;
  existingPersona?: UserPersona; // For edit mode
}

type OnboardingStep = 'welcome' | 'role' | 'skills' | 'goals' | 'style' | 'complete';

export function Onboarding({ onComplete, existingPersona }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState<{
    name?: string;
    role?: UserRole;
    customRole?: string;
    skills: TechSkill[];
    goals: LearningGoal[];
    learningStyle: LearningStyle;
  }>({
    name: existingPersona?.profile.name,
    role: existingPersona?.profile.role,
    customRole: existingPersona?.profile.customRole,
    skills: existingPersona?.skills || [],
    goals: existingPersona?.learningGoals || [],
    learningStyle: existingPersona?.preferredLearningStyle || 'mixed',
  });

  const handleSkip = async () => {
    // If editing, just close without changes
    if (existingPersona) {
      onComplete(existingPersona);
      return;
    }

    // Create minimal persona for new users
    const minimalPersona = createMinimalPersona();
    await savePersona(minimalPersona);
    onComplete(minimalPersona);
  };

  const handleWelcomeNext = (name?: string) => {
    setFormData({ ...formData, name });
    setCurrentStep('role');
  };

  const handleRoleNext = (role: UserRole, customRole?: string) => {
    setFormData({ ...formData, role, customRole });
    setCurrentStep('skills');
  };

  const handleSkillsNext = (skills: TechSkill[]) => {
    setFormData({ ...formData, skills });
    setCurrentStep('goals');
  };

  const handleGoalsNext = (goals: LearningGoal[]) => {
    setFormData({ ...formData, goals });
    setCurrentStep('style');
  };

  const handleGoalsSkip = () => {
    setFormData({ ...formData, goals: [] });
    setCurrentStep('style');
  };

  const handleStyleFinish = async (learningStyle: LearningStyle) => {
    setFormData({ ...formData, learningStyle });
    setCurrentStep('complete');

    // Create or update persona
    const now = new Date().toISOString();
    const persona: UserPersona = {
      version: '1.0',
      createdAt: existingPersona?.createdAt || now,
      updatedAt: now,
      profile: {
        name: formData.name,
        role: formData.role || 'other',
        customRole: formData.customRole,
      },
      skills: formData.skills,
      learningGoals: formData.goals,
      preferredLearningStyle: learningStyle,
      usage: existingPersona?.usage || {
        totalDocsAnalyzed: 0,
        topicsExplored: [],
        lastActiveDate: now,
        firstUseDate: now,
        skillLevelUps: [],
      },
      suggestedUpdates: existingPersona?.suggestedUpdates || [],
    };

    await savePersona(persona);

    // Show completion screen briefly before calling onComplete
    setTimeout(() => {
      onComplete(persona);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-primary-500 dark:bg-primary-600 flex items-center justify-center p-6 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {currentStep === 'welcome' && (
          <WelcomeStep
            initialName={formData.name}
            onNext={handleWelcomeNext}
            onSkip={handleSkip}
            isEditMode={!!existingPersona}
          />
        )}

        {currentStep === 'role' && (
          <RoleStep
            initialRole={formData.role}
            initialCustomRole={formData.customRole}
            onNext={handleRoleNext}
            onBack={() => setCurrentStep('welcome')}
          />
        )}

        {currentStep === 'skills' && (
          <SkillsStep
            initialSkills={formData.skills}
            onNext={handleSkillsNext}
            onBack={() => setCurrentStep('role')}
          />
        )}

        {currentStep === 'goals' && (
          <GoalsStep
            initialGoals={formData.goals}
            onNext={handleGoalsNext}
            onBack={() => setCurrentStep('skills')}
            onSkip={handleGoalsSkip}
          />
        )}

        {currentStep === 'style' && (
          <StyleStep
            initialStyle={formData.learningStyle}
            onFinish={handleStyleFinish}
            onBack={() => setCurrentStep('goals')}
          />
        )}

        {currentStep === 'complete' && (
          <div className="p-16 flex flex-col gap-6 text-center">
            <div className="flex-1">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">All set!</h1>
                <PartyPopper className="w-10 h-10 text-primary-500 dark:text-primary-400" />
              </div>
              <p className="text-xl font-semibold text-primary-600 dark:text-primary-400 mb-6">
                Your AI learning companion is ready!
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                We'll personalize every documentation analysis based on your profile. Your data is
                stored locally and syncs across your Chrome browsers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
