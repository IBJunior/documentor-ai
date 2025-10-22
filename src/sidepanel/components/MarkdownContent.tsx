import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-semibold
        prose-p:leading-relaxed
        prose-li:leading-relaxed
        prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
        prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(marked.parse(content) as string),
      }}
    />
  );
}
