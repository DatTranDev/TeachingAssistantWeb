import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  reply: string;
}

export interface HistoryResponse {
  history: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

export const aiApi = {
  /**
   * Send a message to the AI assistant.
   */
  chat: async (message: string, language?: string): Promise<string> => {
    const { data } = await apiClient.post<ChatResponse>('/ai/chat', { message, language });
    return data.reply;
  },

  /**
   * Fetch chat history for the current user.
   */
  getHistory: async (language?: string): Promise<{ history: ChatMessage[] }> => {
    const { data } = await apiClient.get<HistoryResponse>(`/ai/history?language=${language || ''}`);
    return {
      history: data.history.map(item => ({
        role: (item.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: item.content,
        timestamp: new Date(item.timestamp)
      }))
    };
  },

};
