import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279/api';

export interface MessageUser {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationContext {
  type: 'listing' | 'lostFound';
  id: string;
  title: string;
  imageUrl?: string;
}

export interface ConversationListItem {
  id: string;
  otherUser: MessageUser;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount: number;
  context?: ConversationContext;
}

export interface ConversationDetail {
  id: string;
  otherUser: MessageUser;
  context?: ConversationContext;
  messages: Message[];
}

export interface StartConversationRequest {
  userId: string;
  listingId?: string;
  lostFoundId?: string;
  initialMessage?: string;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = authService.getAccessToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    const refreshed = await authService.refresh();
    if (refreshed) return apiFetch(endpoint, options);
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const messagesApi = {
  // Получить список диалогов
  getConversations: async (): Promise<ConversationListItem[]> => {
    return apiFetch('/messages/conversations');
  },

  // Получить диалог с сообщениями
  getConversation: async (id: string): Promise<ConversationDetail> => {
    return apiFetch(`/messages/conversations/${id}`);
  },

  // Начать или найти диалог
  startConversation: async (request: StartConversationRequest): Promise<ConversationDetail> => {
    return apiFetch('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Отправить сообщение
  sendMessage: async (conversationId: string, text: string): Promise<Message> => {
    return apiFetch(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Получить количество непрочитанных
  getUnreadCount: async (): Promise<number> => {
    const result = await apiFetch<{ count: number }>('/messages/unread-count');
    return result.count;
  },

  // Найти существующий диалог с пользователем
  findConversation: async (
    userId: string,
    listingId?: string,
    lostFoundId?: string
  ): Promise<string | null> => {
    const params = new URLSearchParams();
    if (listingId) params.set('listingId', listingId);
    if (lostFoundId) params.set('lostFoundId', lostFoundId);

    const query = params.toString();
    try {
      const result = await apiFetch<{ conversationId: string }>(
        `/messages/conversation-with/${userId}${query ? `?${query}` : ''}`
      );
      return result.conversationId;
    } catch {
      return null;
    }
  },
};
