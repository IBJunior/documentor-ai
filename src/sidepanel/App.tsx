import { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { OverviewTab } from './components/OverviewTab';
import type { ExplanationState } from './components/OverviewTab';
import { Onboarding } from './components/onboarding/Onboarding';
import { Settings } from './components/Settings';
import { ApiStatusBanner } from './components/ApiStatusBanner';
import { useExplanationState } from './hooks/useExplanationState';
import { useContentListener } from './hooks/useContentListener';
import { useApiAvailability } from './hooks/useApiAvailability';
import { loadPersona } from './persona-storage';
import type { UserPersona } from '../types/persona';

type DisplayMode = 'deep-analysis' | 'quick-scan' | 'cheat-sheet' | 'ask-me';

export function App() {
  const [displayMode, setDisplayMode] = useState<DisplayMode | null>(null);
  const [userPersona, setUserPersona] = useState<UserPersona | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingPersona, setIsLoadingPersona] = useState(true);

  // Use custom hooks to manage state
  const {
    selectionAction,
    conversationId,
    isExplanationLoading,
    loadingStatusMessage,
    explanationError,
    firstMessage,
    setSelectionAction,
    handleExplainAction,
    handleStartChat,
    handleAskFollowUp,
  } = useExplanationState();

  // Check API availability on mount
  const { apiStatus, recheckApis } = useApiAvailability();

  // Handle content from storage changes
  async function displaySelectedContent(action: string, text: string) {
    setSelectionAction(action);
    setDisplayMode('ask-me');
    await handleExplainAction(action, text);
  }

  async function displayImageContent(imageBase64: string, imageSrc?: string, imageAlt?: string) {
    setSelectionAction('explain-image');
    setDisplayMode('ask-me');
    await handleExplainAction('explain-image', undefined, imageBase64, imageSrc, imageAlt);
  }

  // Listen for selected content from storage
  useContentListener({
    onTextContent: displaySelectedContent,
    onImageContent: displayImageContent,
  });

  // Check for persona on mount
  useEffect(() => {
    async function checkPersona() {
      const persona = await loadPersona();
      if (!persona) {
        setShowOnboarding(true);
      } else {
        setUserPersona(persona);
      }
      setIsLoadingPersona(false);
    }
    checkPersona();
  }, []);

  // Handle onboarding completion
  function handleOnboardingComplete(persona: UserPersona) {
    setUserPersona(persona);
    setShowOnboarding(false);
    setIsEditingPersona(false);
  }

  // Handle persona update from settings
  function handlePersonaUpdate(persona: UserPersona) {
    setUserPersona(persona);
  }

  // Handle edit persona from settings
  function handleEditPersona() {
    setShowSettings(false);
    setIsEditingPersona(true);
    setShowOnboarding(true);
  }

  // Create explanation state object
  const explanationState: ExplanationState = useMemo(
    () => ({
      action: selectionAction,
      conversationId,
      isLoading: isExplanationLoading,
      loadingStatusMessage,
      error: explanationError,
      onStartChat: handleStartChat,
      onAskFollowUp: handleAskFollowUp,
      firstMessage,
    }),
    [
      selectionAction,
      conversationId,
      isExplanationLoading,
      loadingStatusMessage,
      explanationError,
      handleStartChat,
      handleAskFollowUp,
      firstMessage,
    ]
  );

  console.log('API Status:', apiStatus);

  if (!apiStatus.allAvailable && !apiStatus.anyAvailable) {
    return (
      <div className="mt-40 flex flex-col items-center">
        <h1 className="text-black dark:text-white mb-8 text-4xl font-semibold">DocuMentor AI</h1>
        <ApiStatusBanner apiStatus={apiStatus} onRecheck={recheckApis} />
      </div>
    );
  }
  // Show loading state
  if (isLoadingPersona) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-600 dark:text-gray-400">
        <p>Loading...</p>
      </div>
    );
  }

  // Show onboarding if needed (either first time or editing)
  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        existingPersona={isEditingPersona ? userPersona || undefined : undefined}
      />
    );
  }

  return (
    <>
      {/* App Header - Clean, flat design with serif font */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-black dark:text-white text-2xl font-semibold">DocuMentor AI</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 flex items-center justify-center transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
          aria-label="Open settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Show settings overlay when requested */}
      {showSettings && (
        <div className="settings-overlay">
          <Settings
            persona={userPersona}
            onPersonaUpdate={handlePersonaUpdate}
            onClose={() => setShowSettings(false)}
            onEditPersona={handleEditPersona}
          />
        </div>
      )}

      {/* Main content - hide when settings are shown */}
      <div className={showSettings ? 'hidden' : 'block'}>
        {/* Show API status banner if any APIs are unavailable */}
        <ApiStatusBanner apiStatus={apiStatus} onRecheck={recheckApis} />

        <OverviewTab
          userPersona={userPersona}
          explanationState={explanationState}
          externalDisplayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
        />
      </div>
    </>
  );
}
