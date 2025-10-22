// Image explanation menu
import './image-menu.css';
import { SVG_ICONS } from './svg-icons';
import { validateAndConvertImage, convertBlobToBase64 } from './image-utils';
import { contentScriptLogger } from '../utils/logger';

// Import logger to expose global debug functions
import '../utils/logger';

(function () {
  'use strict';

  let menuButton: HTMLButtonElement | null = null;
  let currentImage: HTMLImageElement | null = null;

  // Minimum image size to show the button (filters out icons, thumbnails)
  const MIN_IMAGE_SIZE = 100;

  // Create the floating button element
  function createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'documentor-image-explain-btn';
    button.className = 'documentor-image-explain-btn';
    button.innerHTML = `
      <span class="btn-icon">${SVG_ICONS.scanEye}</span>
      <span class="btn-tooltip">Explain this image</span>
    `;
    button.addEventListener('click', handleButtonClick);
    document.body.appendChild(button);
    return button;
  }

  // Handle button click
  async function handleButtonClick(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (currentImage) {
      const imageSrc = currentImage.src || currentImage.currentSrc;
      const imageAlt = currentImage.alt;

      await contentScriptLogger.info('Explain image clicked', {
        src: imageSrc,
        alt: imageAlt,
        width: currentImage.naturalWidth,
        height: currentImage.naturalHeight,
      });

      try {
        // Fetch image in content script (avoids CORS issues)
        await contentScriptLogger.debug('Fetching image from', { imageSrc });
        const response = await fetch(imageSrc);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const imageBlob = await response.blob();
        await contentScriptLogger.debug('Image fetched', {
          type: imageBlob.type,
          size: imageBlob.size,
        });

        // Validate and convert if needed
        const validatedBlob = await validateAndConvertImage(imageBlob);
        await contentScriptLogger.debug('Image validated/converted', {
          originalType: imageBlob.type,
          finalType: validatedBlob.type,
          finalSize: validatedBlob.size,
        });

        // Convert blob to base64 for Chrome messaging
        const imageBase64 = await convertBlobToBase64(validatedBlob);
        await contentScriptLogger.debug('Image converted to base64', {
          base64Length: imageBase64.length,
        });

        // Send base64 to background script
        chrome.runtime.sendMessage({
          type: 'OPEN_SIDEPANEL_WITH_IMAGE',
          imageData: imageBase64,
          imageBlobType: validatedBlob.type,
          imageSrc: imageSrc,
          imageAlt: imageAlt,
        });

        hideButton();
      } catch (error) {
        await contentScriptLogger.error('Failed to process image', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to process image. Please try again.';
        alert(errorMessage);
      }
    }
  }

  // Check if image is large enough to show button
  function isImageLargeEnough(img: HTMLImageElement): boolean {
    const rect = img.getBoundingClientRect();
    return rect.width >= MIN_IMAGE_SIZE && rect.height >= MIN_IMAGE_SIZE;
  }

  // Position button at top-right corner of image
  function positionButton(img: HTMLImageElement): void {
    if (!menuButton) {
      menuButton = createButton();
    }

    const rect = img.getBoundingClientRect();
    const buttonSize = 36;
    const offset = 8;

    menuButton.style.left = `${rect.right - buttonSize - offset + window.scrollX}px`;
    menuButton.style.top = `${rect.top + offset + window.scrollY}px`;
    menuButton.style.display = 'flex';
  }

  // Show button for image
  function showButton(img: HTMLImageElement): void {
    if (isImageLargeEnough(img)) {
      currentImage = img;
      positionButton(img);
    }
  }

  // Hide button
  function hideButton(): void {
    if (menuButton) {
      menuButton.style.display = 'none';
      currentImage = null;
    }
  }

  // Handle image hover
  function handleImageHover(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.tagName === 'IMG') {
      showButton(target as HTMLImageElement);
    }
  }

  // Handle image click (alternative/fallback for mobile)
  function handleImageClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (isImageLargeEnough(img)) {
        // On mobile or if button not visible, show it on click
        if (window.innerWidth < 768 || menuButton?.style.display === 'none') {
          event.preventDefault();
          showButton(img);
        }
      }
    }
  }

  // Setup event listeners
  document.addEventListener('mouseover', handleImageHover);
  document.addEventListener('click', handleImageClick);

  // Hide button when mouse leaves image area
  document.addEventListener('mousemove', (event: MouseEvent) => {
    if (!currentImage || !menuButton) return;

    const target = event.target as HTMLElement;
    const isOnButton = menuButton.contains(target);
    const isOnImage = target === currentImage;

    if (!isOnButton && !isOnImage) {
      // Check if mouse is still within image bounds
      const rect = currentImage.getBoundingClientRect();
      const buttonRect = menuButton.getBoundingClientRect();

      const x = event.clientX;
      const y = event.clientY;

      const isInImageArea = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      const isInButtonArea =
        x >= buttonRect.left &&
        x <= buttonRect.right &&
        y >= buttonRect.top &&
        y <= buttonRect.bottom;

      if (!isInImageArea && !isInButtonArea) {
        hideButton();
      }
    }
  });

  // Hide button on scroll
  document.addEventListener(
    'scroll',
    () => {
      if (currentImage && menuButton?.style.display !== 'none') {
        positionButton(currentImage); // Reposition on scroll
      }
    },
    true
  );

  // Hide button when clicking outside
  document.addEventListener('mousedown', (event) => {
    if (menuButton && !menuButton.contains(event.target as Node)) {
      const target = event.target as HTMLElement;
      if (target.tagName !== 'IMG') {
        hideButton();
      }
    }
  });

  contentScriptLogger.info('DocuMentor AI: Image explanation menu initialized');
})();
