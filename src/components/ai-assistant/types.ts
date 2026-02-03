export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'link' | 'action';
  label: string;
  labelKa?: string;
  url?: string;
  action?: string;
}

export interface ChatSession {
  sessionId: string;
  status: 'active' | 'closed';
  messageCount: number;
  messages: ChatMessage[];
  createdAt: string;
}

export interface SendMessageResponse {
  response: string;
  suggestedActions?: SuggestedAction[];
}
