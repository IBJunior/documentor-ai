import { usePageScanState } from './usePageScanState';

interface QuickScanOptions {
  isActive?: boolean;
}

export function useQuickScanState(options: QuickScanOptions = {}) {
  return usePageScanState({
    length: 'medium',
    isActive: options.isActive,
    type: 'tldr',
    scanningMessage: '⚡ Creating your quick scan...',
  });
}
