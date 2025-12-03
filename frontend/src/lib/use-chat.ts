'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { authService } from './auth';
import type { Message } from './messages-api';

const HUB_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5279';

export interface NewMessageNotification {
  conversationId: string;
  senderId: string;
  senderName: string;
  preview: string;
}

export interface UseChatOptions {
  onNewMessage?: (notification: NewMessageNotification) => void;
  onNewConversation?: (notification: NewMessageNotification & { userName: string }) => void;
}

export function useChat(options?: UseChatOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const optionsRef = useRef(options);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isConnectingRef = useRef(false);

  // Обновляем ref при изменении options
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Подключение к хабу
  useEffect(() => {
    const token = authService.getAccessToken();
    if (!token || isConnectingRef.current || connectionRef.current) return;

    isConnectingRef.current = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}/hubs/chat`, {
        accessTokenFactory: () => authService.getAccessToken() || '',
        // Используем все транспорты с приоритетом WebSocket
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Обработчики событий
    connection.on('NewMessage', (notification: NewMessageNotification) => {
      setUnreadCount((prev) => prev + 1);
      optionsRef.current?.onNewMessage?.(notification);
    });

    connection.on('NewConversation', (notification: NewMessageNotification & { userName: string }) => {
      setUnreadCount((prev) => prev + 1);
      optionsRef.current?.onNewConversation?.(notification);
    });

    connection.on('Error', (message: string) => {
      console.warn('SignalR error:', message);
    });

    connection.onclose((error) => {
      setIsConnected(false);
      if (error) {
        console.warn('SignalR connection closed:', error);
      }
    });

    connection.onreconnecting((error) => {
      setIsConnected(false);
      if (error) {
        console.warn('SignalR reconnecting:', error);
      }
    });

    connection.onreconnected(() => {
      setIsConnected(true);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        isConnectingRef.current = false;
      })
      .catch((err) => {
        console.warn('SignalR connection error:', err.message);
        isConnectingRef.current = false;
        // Не критично - REST API работает как fallback
      });

    return () => {
      isConnectingRef.current = false;
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, []);

  // Присоединиться к комнате диалога
  const joinConversation = useCallback(async (conversationId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('JoinConversation', conversationId);
      } catch (err) {
        console.warn('Failed to join conversation:', err);
      }
    }
  }, []);

  // Покинуть комнату диалога
  const leaveConversation = useCallback(async (conversationId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('LeaveConversation', conversationId);
      } catch (err) {
        console.warn('Failed to leave conversation:', err);
      }
    }
  }, []);

  // Отправить сообщение через SignalR
  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('SendMessage', conversationId, text);
      } catch (err) {
        console.warn('Failed to send via SignalR:', err);
        throw err; // Пробрасываем для fallback на REST
      }
    }
  }, []);

  // Отметить сообщения как прочитанные
  const markAsRead = useCallback(async (conversationId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('MarkAsRead', conversationId);
      } catch (err) {
        console.warn('Failed to mark as read:', err);
      }
    }
  }, []);

  // Подписка на сообщения в комнате
  const onReceiveMessage = useCallback((callback: (message: Message) => void) => {
    connectionRef.current?.on('ReceiveMessage', callback);
    return () => connectionRef.current?.off('ReceiveMessage', callback);
  }, []);

  // Подписка на прочтение сообщений
  const onMessagesRead = useCallback((callback: (conversationId: string, userId: string) => void) => {
    connectionRef.current?.on('MessagesRead', callback);
    return () => connectionRef.current?.off('MessagesRead', callback);
  }, []);

  return {
    isConnected,
    unreadCount,
    setUnreadCount,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    onReceiveMessage,
    onMessagesRead,
  };
}
