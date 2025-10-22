export type ExplainAction = 'eli5' | 'explain' | 'explain-image';

export interface ChatContext {
  pageUrl: string;
  pageSummary: string;
  userPersona?: string;
  pageTitle?: string;
}

export interface ImagePart {
  image: string; // base64 data URL
  imageAlt?: string;
  imageSrc?: string;
}

export interface ExplainContent {
  text?: string;
  image?: ImagePart;
  // One of the two is required
}

export interface ExplainOptions {
  context: ChatContext;
  content: ExplainContent;
  action?: ExplainAction;
}
