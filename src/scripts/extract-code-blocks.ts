/**
 * Code Block Extractor
 * Extracts code blocks from HTML elements for AI language identification
 */

export interface ExtractedCodeBlock {
  code: string;
  hint?: string; // Language hint from HTML class (e.g., "javascript", "python")
}

/**
 * Extract language hint from element class names
 * Common patterns: language-js, lang-python, hljs-javascript, js, etc.
 */
function extractLanguageHint(element: Element): string | undefined {
  const classNames = element.className;
  if (typeof classNames !== 'string') return undefined;

  // Common class patterns for code language hints
  const patterns = [
    /language-(\w+)/i,
    /lang-(\w+)/i,
    /hljs-(\w+)/i,
    /\b(javascript|typescript|python|java|csharp|cpp|c|go|rust|ruby|php|swift|kotlin|html|css|json|yaml|xml|sql|bash|shell|powershell|r|scala|dart)\b/i,
  ];

  for (const pattern of patterns) {
    const match = classNames.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return undefined;
}

/**
 * Check if code block is likely meaningful (not empty, not too short)
 */
function isValidCodeBlock(code: string): boolean {
  const trimmed = code.trim();
  // Must have at least 10 characters and at least one newline or semicolon/brace
  return trimmed.length >= 10 && /[\n;{}()]/.test(trimmed);
}

/**
 * Extract code blocks from the page
 */
function extractCodeBlocks(): ExtractedCodeBlock[] {
  const codeBlocks: ExtractedCodeBlock[] = [];
  const seenCodes = new Set<string>();

  // Strategy 1: Find <pre><code> combinations (most common in documentation)
  const preCodeElements = document.querySelectorAll('pre > code, pre code');
  preCodeElements.forEach((codeElement) => {
    const code = codeElement.textContent?.trim() || '';
    if (!code || !isValidCodeBlock(code)) return;

    // Deduplicate
    if (seenCodes.has(code)) return;
    seenCodes.add(code);

    // Try to get language hint from code or pre element
    const hint =
      extractLanguageHint(codeElement) || extractLanguageHint(codeElement.parentElement as Element);

    codeBlocks.push({ code, hint });
  });

  // Strategy 2: Find standalone <pre> elements (without nested <code>)
  const preElements = document.querySelectorAll('pre:not(:has(code))');
  preElements.forEach((preElement) => {
    const code = preElement.textContent?.trim() || '';
    if (!code || !isValidCodeBlock(code)) return;

    // Deduplicate
    if (seenCodes.has(code)) return;
    seenCodes.add(code);

    const hint = extractLanguageHint(preElement);
    codeBlocks.push({ code, hint });
  });

  // Strategy 3: Find <code> elements with specific classes (inline code with language hints)
  const standaloneCodeElements = document.querySelectorAll(
    'code[class*="language-"], code[class*="lang-"], code[class*="hljs-"]'
  );
  standaloneCodeElements.forEach((codeElement) => {
    // Skip if already processed (inside a <pre>)
    if (codeElement.closest('pre')) return;

    const code = codeElement.textContent?.trim() || '';
    if (!code || !isValidCodeBlock(code)) return;

    // Deduplicate
    if (seenCodes.has(code)) return;
    seenCodes.add(code);

    const hint = extractLanguageHint(codeElement);
    codeBlocks.push({ code, hint });
  });

  // Strategy 4: Find code blocks in markdown-style fenced code (``` ... ```)
  // This is for sites that render markdown as HTML but preserve the backticks
  const textNodes = document.querySelectorAll('p, div, article, main');
  textNodes.forEach((node) => {
    const text = node.textContent || '';
    // Match triple backticks with optional language
    const fencedCodeRegex = /```(\w+)?\n([\s\S]+?)```/g;
    let match;

    while ((match = fencedCodeRegex.exec(text)) !== null) {
      const hint = match[1]?.toLowerCase();
      const code = match[2]?.trim() || '';

      if (!code || !isValidCodeBlock(code)) continue;

      // Deduplicate
      if (seenCodes.has(code)) continue;
      seenCodes.add(code);

      codeBlocks.push({ code, hint });
    }
  });

  return codeBlocks;
}

// Execute and return result
const result = extractCodeBlocks();
result;
