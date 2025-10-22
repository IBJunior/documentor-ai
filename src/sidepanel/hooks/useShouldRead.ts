import { useState, useEffect } from 'react';
import { analyzeIfShouldRead, type ShouldReadRecommendation } from '../reading-suggestion';
import { getPersonaSummary } from '../context';
import { sidepanelLogger } from '../../utils/logger';
import { formatPageArchitectureForAI } from '../utils';
import type { PageHeading } from '../../types/extraction';

export function useShouldRead(pageSummary: string) {
  const [recommendation, setRecommendation] = useState<ShouldReadRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldReadDuration, setShouldReadDuration] = useState<number>(0);

  useEffect(() => {
    async function fetchRecommendation() {
      const startTime = Date.now();
      if (!pageSummary) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get user persona
        const userPersona = await getPersonaSummary();

        // Get page architecture from storage
        const storageData = await chrome.storage.session.get('pageArchitecture');
        const pageArchitecture = storageData.pageArchitecture as PageHeading[] | undefined;

        // Format architecture for AI model (limited to prevent token overflow)
        const formattedArchitecture = formatPageArchitectureForAI(pageArchitecture);

        sidepanelLogger.info(
          'Generating should-read recommendation with user persona:',
          userPersona
        );
        const result = await analyzeIfShouldRead(pageSummary, formattedArchitecture, userPersona);
        setRecommendation(result);
      } catch (e) {
        console.error('Failed to generate should-read recommendation:', e);
        setError((e as Error).message);
        setRecommendation(null);
      } finally {
        setIsLoading(false);
        const endTime = Date.now();
        const duration = endTime - startTime;
        setShouldReadDuration(Math.floor(duration / 1000)); // in seconds
        sidepanelLogger.info(`Should-read analysis completed in ${duration / 1000} s`);
      }
    }

    fetchRecommendation();
  }, [pageSummary]);

  return {
    recommendation,
    isLoading,
    error,
    shouldReadDuration,
  };
}
