'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { messagesApi, ConversationDetail, Message } from '@/lib/messages-api';
import { useChat } from '@/lib/use-chat';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: sendViaSignalR,
    markAsRead,
    onReceiveMessage,
    onMessagesRead,
  } = useChat();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Загрузка диалога
  useEffect(() => {
    if (isAuthenticated && id) {
      loadConversation();
    }
  }, [isAuthenticated, id]);

  // Присоединение к комнате SignalR
  useEffect(() => {
    if (isConnected && id) {
      joinConversation(id);
      return () => {
        leaveConversation(id);
      };
    }
  }, [isConnected, id, joinConversation, leaveConversation]);

  // Подписка на новые сообщения
  useEffect(() => {
    const unsubscribe = onReceiveMessage((message: Message) => {
      setMessages((prev) => {
        // Проверяем, нет ли уже такого сообщения
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Отмечаем как прочитанное, если сообщение не от нас
      if (message.senderId !== user?.id) {
        markAsRead(id);
      }
    });

    return unsubscribe;
  }, [onReceiveMessage, user?.id, id, markAsRead]);

  // Подписка на прочтение сообщений
  useEffect(() => {
    const unsubscribe = onMessagesRead((convId: string, readerId: string) => {
      if (convId === id && readerId !== user?.id) {
        // Отмечаем все наши сообщения как прочитанные
        setMessages((prev) =>
          prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m))
        );
      }
    });

    return unsubscribe;
  }, [onMessagesRead, id, user?.id]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    setIsLoading(true);
    try {
      const data = await messagesApi.getConversation(id);
      setConversation(data);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      if (isConnected) {
        await sendViaSignalR(id, newMessage.trim());
      } else {
        // Fallback на REST API
        await messagesApi.sendMessage(id, newMessage.trim());
        loadConversation();
      }
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Группировка сообщений по дням
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, Message[]>
  );

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || 'Диалог не найден'}
        </div>
        <Link href="/messages" className="mt-4 inline-block text-green-600 hover:underline">
          Вернуться к сообщениям
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>

        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-700 font-medium">
            {conversation.otherUser.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-medium text-gray-900 truncate">{conversation.otherUser.name}</h1>
          {conversation.context && (
            <Link
              href={
                conversation.context.type === 'listing'
                  ? `/listings/${conversation.context.id}`
                  : `/lost-found/${conversation.context.id}`
              }
              className="text-xs text-green-600 hover:underline truncate block"
            >
              {conversation.context.type === 'listing' ? 'Объявление: ' : 'Потеряшка: '}
              {conversation.context.title}
            </Link>
          )}
        </div>

        {!isConnected && (
          <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            Офлайн
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(dayMessages[0].createdAt)}
              </span>
            </div>

            {/* Messages for this day */}
            {dayMessages.map((message) => {
              const isOwn = message.senderId === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-green-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 ${
                        isOwn ? 'text-green-100' : 'text-gray-400'
                      }`}
                    >
                      <span className="text-xs">{formatTime(message.createdAt)}</span>
                      {isOwn && (
                        <svg
                          className={`w-4 h-4 ${message.isRead ? 'text-green-200' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {message.isRead ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          )}
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение..."
            rows={1}
            className="flex-1 resize-none border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
