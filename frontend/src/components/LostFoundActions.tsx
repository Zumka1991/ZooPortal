'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { messagesApi } from '@/lib/messages-api';

interface LostFoundActionsProps {
  itemId: string;
  userId: string;
  userName: string;
  contactPhone?: string;
}

export default function LostFoundActions({
  itemId,
  userId,
  userName,
  contactPhone,
}: LostFoundActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPhone, setShowPhone] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const isOwner = user?.id === userId;

  const handleStartChat = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsStartingChat(true);
    try {
      const conversation = await messagesApi.startConversation({
        userId: userId,
        lostFoundId: itemId,
      });
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-700 font-medium">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="font-medium">{userName}</span>
      </div>

      {contactPhone && (
        showPhone ? (
          <a
            href={`tel:${contactPhone}`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {contactPhone}
          </a>
        ) : (
          <button
            onClick={() => setShowPhone(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Показать телефон
          </button>
        )
      )}

      {!isOwner && (
        <button
          onClick={handleStartChat}
          disabled={isStartingChat}
          className="flex items-center gap-2 px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {isStartingChat ? 'Загрузка...' : 'Написать'}
        </button>
      )}
    </div>
  );
}
