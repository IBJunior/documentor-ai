import { useState, useEffect } from 'react';
import { checkAllAPIs, type AllApiStatus } from '../../utils/api-checker';

const INITIAL_STATE: AllApiStatus = {
  languageModel: { available: 'unavailable', needsUserGesture: false },
  summarizer: { available: 'unavailable', needsUserGesture: false },
  writer: { available: 'unavailable', needsUserGesture: false },
  allAvailable: false,
  anyAvailable: false,
  needsUserGesture: false,
  isChecking: true,
};

/**
 * Hook to check Chrome AI API availability on mount
 * Used for startup verification to inform users about API status
 */
export function useApiAvailability() {
  const [apiStatus, setApiStatus] = useState<AllApiStatus>(INITIAL_STATE);

  const checkApis = async () => {
    setApiStatus((prev) => ({ ...prev, isChecking: true }));
    try {
      const status = await checkAllAPIs();
      setApiStatus(status);
    } catch (error) {
      console.error('Failed to check API availability:', error);
      setApiStatus({
        languageModel: { available: 'unavailable', error: 'Check failed', needsUserGesture: false },
        summarizer: { available: 'unavailable', error: 'Check failed', needsUserGesture: false },
        writer: { available: 'unavailable', error: 'Check failed', needsUserGesture: false },
        allAvailable: false,
        anyAvailable: false,
        needsUserGesture: false,
        isChecking: false,
      });
    }
  };

  useEffect(() => {
    checkApis();
  }, []);

  return {
    apiStatus,
    recheckApis: checkApis,
    isChecking: apiStatus.isChecking,
  };
}
