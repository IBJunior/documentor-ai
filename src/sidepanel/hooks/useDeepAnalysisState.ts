import { useState } from 'react';
import { usePageScanState } from './usePageScanState';

interface DeepAnalysisOptions {
  isActive?: boolean;
}

export function useDeepAnalysisState(options: DeepAnalysisOptions = {}) {
  const [codeAnalysisDuration, setCodeAnalysisDuration] = useState<number>(0);

  const baseScanState = usePageScanState({
    length: 'long',
    isActive: options.isActive,
    scanningMessage: '⚙️ Performing deep analysis...',
    extractCodeBlocks: true, // Enable code block extraction for Deep Analysis
  });

  return {
    ...baseScanState,
    codeAnalysisDuration,
    setCodeAnalysisDuration,
  };
}
