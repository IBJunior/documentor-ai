import type { PageHeading } from '../../types/extraction';

interface PageArchitectureProps {
  architecture?: PageHeading[];
}

const MAX_CHILDREN_PER_H1 = 10;
const MAX_HEADING_LENGTH = 80;

function truncateText(text: string): string {
  if (text.length <= MAX_HEADING_LENGTH) {
    return text;
  }
  return text.substring(0, MAX_HEADING_LENGTH - 3) + '...';
}

export function PageArchitecture({ architecture }: PageArchitectureProps) {
  // Don't render if no architecture is available
  if (!architecture || architecture.length === 0) {
    return null;
  }

  // Don't display if only one h1 with no children (not meaningful)
  if (architecture.length === 1 && architecture[0].children.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4">
      {/* Custom List Rendering */}
      <div className="space-y-4">
        {architecture.map((heading, index) => (
          <div key={index} className="space-y-1.5">
            {/* H1 Section - Medium weight, slightly larger */}
            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
              {truncateText(heading.h1)}
            </div>

            {/* Children (H2/H3) */}
            {heading.children.length > 0 && (
              <ul className="space-y-1 ml-4">
                {heading.children.slice(0, MAX_CHILDREN_PER_H1).map((child, childIndex) => (
                  <li
                    key={childIndex}
                    className={`text-sm text-gray-600 dark:text-gray-400 ${
                      child.level === 3 ? 'ml-4' : ''
                    }`}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mr-2 align-middle" />
                    {truncateText(child.text)}
                  </li>
                ))}

                {/* Truncation indicator */}
                {heading.children.length > MAX_CHILDREN_PER_H1 && (
                  <li className="text-sm text-gray-500 dark:text-gray-500 italic ml-4">
                    ... and {heading.children.length - MAX_CHILDREN_PER_H1} more
                  </li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
