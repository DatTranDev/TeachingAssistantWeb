import ChatInterface from '@/components/ai/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant | Teaching Assistant',
  description: 'Chat with your AI assistant powered by Gemini',
};

export default function AIAssistantPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <ChatInterface />
    </div>
  );
}
