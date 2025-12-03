'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { messagesApi, ConversationListItem } from '@/lib/messages-api';
import { useChat } from '@/lib/use-chat';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useChat({
    onNewMessage: (notification) => {
      // Обновляем список диалогов при новом сообщении
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === notification.conversationId
            ? {
                ...conv,
                lastMessageText: notification.preview,
                lastMessageAt: new Date().toISOString(),
                unreadCount: conv.unreadCount + 1,
              }
            : conv
        );
        // Сортируем по времени последнего сообщения
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.id).getTime() -
            new Date(a.lastMessageAt || a.id).getTime()
        );
      });
    },
    onNewConversation: () => {
      // Перезагружаем список при новом диалоге
      loadConversations();
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await messagesApi.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Сообщения</h1>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">{error}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-2">У вас пока нет сообщений</p>
          <p className="text-gray-400 text-sm">
            Напишите владельцу объявления или потеряшки, чтобы начать диалог
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 font-medium text-lg">
                  {conv.otherUser.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {conv.otherUser.name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(conv.lastMessageAt)}
                  </span>
                </div>

                {/* Context (listing or lost-found) */}
                {conv.context && (
                  <div className="flex items-center gap-2 mt-1">
                    {conv.context.imageUrl && (
                      <Image
                        src={conv.context.imageUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded object-cover"
                        unoptimized={conv.context.imageUrl.includes('localhost')}
                      />
                    )}
                    <span className="text-xs text-gray-500 truncate">
                      {conv.context.type === 'listing' ? 'Объявление: ' : 'Потеряшка: '}
                      {conv.context.title}
                    </span>
                  </div>
                )}

                {/* Last message */}
                <p
                  className={`text-sm mt-1 truncate ${
                    conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}
                >
                  {conv.lastMessageText || 'Нет сообщений'}
                </p>
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
