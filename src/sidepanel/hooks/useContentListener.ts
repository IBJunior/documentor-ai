import { useEffect } from 'react';

interface UseContentListenerProps {
  onTextContent: (action: string, text: string) => Promise<void>;
  onImageContent: (imageBase64: string, imageSrc?: string, imageAlt?: string) => Promise<void>;
}

export function useContentListener({ onTextContent, onImageContent }: UseContentListenerProps) {
  // Check for selected content on mount and storage changes
  useEffect(() => {
    checkForSelectedContent();

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string
    ) => {
      if (
        namespace === 'session' &&
        (changes.selectionAction || changes.selectionText || changes.imageData)
      ) {
        checkForSelectedContent();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  async function checkForSelectedContent() {
    const data = await chrome.storage.session.get([
      'selectionAction',
      'selectionText',
      'imageData',
      'imageBlobType',
      'imageSrc',
      'imageAlt',
      'selectionWindowId',
    ]);

    // Get current window ID to check if this sidepanel should handle the content
    const currentWindow = await chrome.windows.getCurrent();
    const currentWindowId = currentWindow.id;

    // Only process if this is the target window for the selection
    if (data.selectionWindowId && data.selectionWindowId !== currentWindowId) {
      return; // This window should ignore the selection
    }

    // Handle text-based actions (eli5, explain-context)
    if (data.selectionAction && data.selectionText) {
      await onTextContent(data.selectionAction, data.selectionText);
      // Clear the stored data after displaying
      chrome.storage.session.remove(['selectionAction', 'selectionText', 'selectionWindowId']);
    }
    // Handle image-based actions
    else if (data.selectionAction === 'explain-image' && data.imageData) {
      await onImageContent(data.imageData, data.imageSrc, data.imageAlt);
      // Clear the stored data after displaying
      chrome.storage.session.remove([
        'selectionAction',
        'imageData',
        'imageBlobType',
        'imageSrc',
        'imageAlt',
        'selectionWindowId',
      ]);
    }
  }
}
