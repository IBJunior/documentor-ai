// Shared type for content extraction results

export interface PageLink {
  url: string;
  text: string;
}

export interface NavigationContext {
  breadcrumbs: PageLink[];
  mainNav: PageLink[];
  sidebar: PageLink[];
  tableOfContents: PageLink[];
}

export interface HeadingChild {
  level: 2 | 3;
  text: string;
}

export interface PageHeading {
  h1: string;
  children: HeadingChild[];
}

export interface ExtractionResult {
  title: string;
  content: string;
  links: PageLink[];
  navigation?: NavigationContext;
  architecture: PageHeading[];
}
