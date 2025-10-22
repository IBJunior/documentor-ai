// Text selection menu for DocuMentor AI
import './selection-menu.css';
import { SVG_ICONS } from './svg-icons';

// Import logger to expose global debug functions
import '../utils/logger';

(function () {
  'use strict';

  let menuElement: HTMLDivElement | null = null;
  let selectedText = '';

  // Create the menu element
  function createMenu(): HTMLDivElement {
    const menu = document.createElement('div');
    menu.id = 'documentor-selection-menu';
    menu.className = 'documentor-selection-menu';
    menu.innerHTML = `
      <div class="documentor-menu-header">DocuMentor AI</div>
      <button class="documentor-menu-btn" data-action="explain">
        <span class="btn-icon">${SVG_ICONS.lightbulb}</span>
        <span class="btn-text">Explain this</span>
      </button>
      <button class="documentor-menu-btn" data-action="eli5">
        <span class="btn-icon">${SVG_ICONS.graduationCap}</span>
        <span class="btn-text">Explain like I'm 5</span>
      </button>
    `;
    document.body.appendChild(menu);

    // Add click handlers
    menu.querySelectorAll('.documentor-menu-btn').forEach((btn) => {
      btn.addEventListener('click', handleButtonClick);
    });

    return menu;
  }

  // Handle button clicks
  function handleButtonClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const action = (event.currentTarget as HTMLElement).getAttribute('data-action');
    console.log(`Action: ${action}`);
    console.log(`Selected text: "${selectedText}"`);

    // Send message to background script to open sidepanel and pass the data
    chrome.runtime.sendMessage({
      type: 'OPEN_SIDEPANEL_WITH_CONTENT',
      action: action,
      selectedText: selectedText,
    });

    // Hide menu after action
    hideMenu();
  }

  // Show menu at the appropriate position
  function showMenu(x: number, y: number): void {
    if (!menuElement) {
      menuElement = createMenu();
    }

    menuElement.style.display = 'flex';

    // Position the menu near the selection
    // Adjust position to keep menu visible on screen
    const menuWidth = 250;
    const menuHeight = 150;

    let left = x;
    let top = y - menuHeight - 10; // Position above selection by default

    // Adjust if menu would go off-screen
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }
    if (left < 0) {
      left = 10;
    }
    if (top < 0) {
      top = y + 20; // Position below selection if not enough space above
    }

    menuElement.style.left = `${left}px`;
    menuElement.style.top = `${top}px`;
  }

  // Hide menu
  function hideMenu(): void {
    if (menuElement) {
      menuElement.style.display = 'none';
    }
  }

  // Handle text selection
  function handleSelection(): void {
    const selection = window.getSelection();
    selectedText = selection?.toString().trim() || '';

    if (selectedText.length > 0) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position menu at the center of the selection
      const x = rect.left + rect.width / 2;
      const y = rect.top + window.scrollY;

      showMenu(x, y);
    } else {
      hideMenu();
    }
  }

  // Listen for mouseup events to detect selection
  document.addEventListener('mouseup', () => {
    // Small delay to ensure selection is complete
    setTimeout(handleSelection, 10);
  });

  // Listen for keyup events (for keyboard selection)
  document.addEventListener('keyup', (event) => {
    // Only check for arrow keys and shift
    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.shiftKey
    ) {
      setTimeout(handleSelection, 10);
    }
  });

  // Hide menu when clicking outside
  document.addEventListener('mousedown', (event) => {
    if (menuElement && !menuElement.contains(event.target as Node)) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection?.toString().trim()) {
          hideMenu();
        }
      }, 10);
    }
  });

  // Hide menu on scroll
  document.addEventListener(
    'scroll',
    () => {
      hideMenu();
    },
    true
  );

  console.log('DocuMentor AI: Text selection menu initialized');
})();
