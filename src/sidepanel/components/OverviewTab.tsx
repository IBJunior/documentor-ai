import { useState, useEffect } from 'react';
import { Zap, Microscope, BookOpen, MessageCircle, Menu, Check, Lightbulb, X } from 'lucide-react';
import { DeepAnalysisDisplay } from './DeepAnalysisDisplay';
import { QuickScanDisplay } from './QuickScanDisplay';
import { CheatSheetDisplay } from './CheatSheetDisplay';
import { AskMeDisplay } from './AskMeDisplay';
import { FeatureHintsCards } from './FeatureHintsCards';
import type { UserPersona } from '../../types/persona';
import type { ChatMessage } from '../conversation';

type DisplayMode = 'deep-analysis' | 'quick-scan' | 'cheat-sheet' | 'ask-me';

export interface ExplanationState {
  action: string | null;
  conversationId: string | null;
  isLoading: boolean;
  loadingStatusMessage?: string;
  error: string | null;
  onStartChat: (message: string) => Promise<void>;
  onAskFollowUp: (question: string) => Promise<void>;
  firstMessage: ChatMessage | null;
}

interface OverviewTabProps {
  userPersona: UserPersona | null;
  explanationState?: ExplanationState;
  externalDisplayMode?: DisplayMode | null;
  onDisplayModeChange?: (mode: DisplayMode | null) => void;
}

export function OverviewTab({
  userPersona,
  explanationState,
  externalDisplayMode = null,
  onDisplayModeChange,
}: OverviewTabProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(true); // Default true, load from storage
  const [showHelpPopover, setShowHelpPopover] = useState(false);

  // Sync with external display mode
  useEffect(() => {
    if (externalDisplayMode !== undefined && externalDisplayMode !== null) {
      setDisplayMode(externalDisplayMode);
    }
  }, [externalDisplayMode]);

  // Load banner dismissal state from storage
  useEffect(() => {
    chrome.storage.local.get(['featureHintsBannerDismissed'], (result) => {
      setIsBannerDismissed(result.featureHintsBannerDismissed === true);
    });
  }, []);

  const handleModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    onDisplayModeChange?.(mode);
    setIsDrawerOpen(false); // Close drawer after selecting a mode
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    chrome.storage.local.set({ featureHintsBannerDismissed: true });
  };

  const toggleHelpPopover = () => {
    setShowHelpPopover(!showHelpPopover);
  };

  // Get mode display information
  const getModeInfo = (mode: DisplayMode) => {
    switch (mode) {
      case 'quick-scan':
        return { label: 'Quick Scan', icon: Zap, color: 'blue' };
      case 'deep-analysis':
        return { label: 'Deep Analysis', icon: Microscope, color: 'primary' };
      case 'cheat-sheet':
        return { label: 'Cheat Sheet', icon: BookOpen, color: 'green' };
      case 'ask-me':
        return { label: 'Ask Me', icon: MessageCircle, color: 'purple' };
    }
  };

  // Render action buttons - large primary buttons if no mode selected, compact nav bar if mode is active
  const renderActionButtons = () => {
    if (!displayMode) {
      // Initial state: large card-style buttons in empty state
      return (
        <div className="flex flex-col gap-4 p-6">
          {/* Welcome Message */}
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {userPersona?.profile?.name
                ? `Welcome back, ${userPersona.profile.name}! Ready to level up your skills today?`
                : 'Ready to level up your skills today?'}
            </h2>
          </div>

          {/* Feature Hints Banner - Dismissable */}
          {!isBannerDismissed && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Tip:</strong> Select text or
                hover over images on any documentation page to get AI explanations instantly!
              </div>
              <button
                onClick={dismissBanner}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                aria-label="Dismiss tip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Scan - Blue accent */}
          <button
            onClick={() => handleModeChange('quick-scan')}
            className="group flex items-start gap-4 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Quick Scan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a rapid overview and key points from the page
              </p>
            </div>
          </button>

          {/* Deep Analysis - Primary terracotta */}
          <button
            onClick={() => handleModeChange('deep-analysis')}
            className="group flex items-start gap-4 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
              <Microscope className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Deep Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Thorough breakdown with prerequisites and learning outcomes
              </p>
            </div>
          </button>

          {/* Cheat Sheet - Green accent */}
          <button
            onClick={() => handleModeChange('cheat-sheet')}
            className="group flex items-start gap-4 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Cheat Sheet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick reference guide with essential commands and concepts
              </p>
            </div>
          </button>

          {/* Ask Me - Purple accent */}
          <button
            onClick={() => handleModeChange('ask-me')}
            className="group flex items-start gap-4 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Ask Me
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with AI to explain selected text or images
              </p>
            </div>
          </button>
        </div>
      );
    }

    // Minimal header with hamburger menu when mode is active
    const modeInfo = getModeInfo(displayMode);
    const ModeIcon = modeInfo.icon;

    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleDrawer}
          className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ModeIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {modeInfo.label}
          </span>
        </div>
      </div>
    );
  };

  // Render slide-out drawer navigation
  const renderDrawer = () => {
    if (!displayMode) return null;

    const modes: Array<{ key: DisplayMode; label: string; icon: any; color: string }> = [
      { key: 'quick-scan', label: 'Quick Scan', icon: Zap, color: 'blue' },
      { key: 'deep-analysis', label: 'Deep Analysis', icon: Microscope, color: 'primary' },
      { key: 'cheat-sheet', label: 'Cheat Sheet', icon: BookOpen, color: 'green' },
      { key: 'ask-me', label: 'Ask Me', icon: MessageCircle, color: 'purple' },
    ];

    return (
      <>
        {/* Overlay */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          />
        )}

        {/* Drawer Panel */}
        <div
          className={`
            fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl z-50
            transform transition-transform duration-300 ease-in-out
            ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
            </div>

            {/* Mode List */}
            <nav className="flex-1 overflow-y-auto py-4">
              {modes.map((mode) => {
                const ModeIcon = mode.icon;
                const isActive = displayMode === mode.key;

                return (
                  <button
                    key={mode.key}
                    onClick={() => handleModeChange(mode.key)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer 
                      ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <ModeIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">{mode.label}</span>
                    </div>
                    {isActive && (
                      <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {renderDrawer()}
      {renderActionButtons()}

      {/* Render all display components, control visibility with CSS */}
      <div className={displayMode === 'quick-scan' ? 'block' : 'hidden'}>
        <QuickScanDisplay isActive={displayMode === 'quick-scan'} />
      </div>

      <div className={displayMode === 'deep-analysis' ? 'block' : 'hidden'}>
        <DeepAnalysisDisplay userPersona={userPersona} isActive={displayMode === 'deep-analysis'} />
      </div>

      <div className={displayMode === 'cheat-sheet' ? 'block' : 'hidden'}>
        <CheatSheetDisplay isActive={displayMode === 'cheat-sheet'} />
      </div>

      <div className={displayMode === 'ask-me' ? 'block' : 'hidden'}>
        {explanationState && (
          <AskMeDisplay
            isActive={displayMode === 'ask-me'}
            action={explanationState.action}
            conversationId={explanationState.conversationId}
            isLoading={explanationState.isLoading}
            loadingStatusMessage={explanationState.loadingStatusMessage}
            error={explanationState.error}
            onStartChat={explanationState.onStartChat}
            onAskFollowUp={explanationState.onAskFollowUp}
            firstMessage={explanationState.firstMessage}
          />
        )}
      </div>

      {/* Floating Help Button - Shows after banner is dismissed */}
      {isBannerDismissed && !displayMode && (
        <>
          <button
            onClick={toggleHelpPopover}
            className="fixed bottom-6 right-6 w-12 h-12 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30 cursor-pointer"
            aria-label="Feature tips"
          >
            <Lightbulb className="w-6 h-6" />
          </button>

          {/* Help Popover */}
          {showHelpPopover && (
            <>
              {/* Overlay to close popover */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowHelpPopover(false)}
                aria-label="Close help popover"
              />

              {/* Popover Content */}
              <div className="fixed bottom-20 right-6 w-[90vw] max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary-500" />
                    Feature Tips
                  </h3>
                  <button
                    onClick={() => setShowHelpPopover(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Feature hints cards */}
                <FeatureHintsCards variant="compact" />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
