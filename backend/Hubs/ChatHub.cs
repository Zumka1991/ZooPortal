using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            // Добавляем пользователя в его персональную группу для получения уведомлений
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    // Присоединиться к комнате диалога
    public async Task JoinConversation(string conversationId)
    {
        var userId = Guid.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var convId = Guid.Parse(conversationId);

        // Проверяем, что пользователь участник диалога
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == convId && (c.User1Id == userId || c.User2Id == userId));

        if (conversation != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }
    }

    // Покинуть комнату диалога
    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
    }

    // Отправить сообщение
    public async Task SendMessage(string conversationId, string text)
    {
        var userId = Guid.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var convId = Guid.Parse(conversationId);

        // Проверяем, что пользователь участник диалога
        var conversation = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .FirstOrDefaultAsync(c => c.Id == convId && (c.User1Id == userId || c.User2Id == userId));

        if (conversation == null)
        {
            await Clients.Caller.SendAsync("Error", "Диалог не найден");
            return;
        }

        var sender = conversation.User1Id == userId ? conversation.User1 : conversation.User2;
        var receiverId = conversation.User1Id == userId ? conversation.User2Id : conversation.User1Id;

        // Создаем сообщение
        var message = new Message
        {
            ConversationId = convId,
            SenderId = userId,
            Text = text.Trim()
        };

        _context.Messages.Add(message);

        // Обновляем данные диалога
        conversation.LastMessageAt = DateTime.UtcNow;
        conversation.LastMessageText = text.Length > 100 ? text[..100] + "..." : text;

        await _context.SaveChangesAsync();

        var messageDto = new MessageDto(
            message.Id,
            userId,
            sender.Name,
            message.Text,
            false,
            message.CreatedAt
        );

        // Отправляем сообщение в комнату диалога
        await Clients.Group($"conversation_{conversationId}").SendAsync("ReceiveMessage", messageDto);

        // Отправляем уведомление получателю (для обновления счетчика)
        await Clients.Group($"user_{receiverId}").SendAsync("NewMessage", new
        {
            conversationId = convId,
            senderId = userId,
            senderName = sender.Name,
            preview = conversation.LastMessageText
        });
    }

    // Отметить сообщения как прочитанные
    public async Task MarkAsRead(string conversationId)
    {
        var userId = Guid.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var convId = Guid.Parse(conversationId);

        // Отмечаем все непрочитанные сообщения от другого пользователя
        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == convId && m.SenderId != userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unreadMessages)
        {
            msg.IsRead = true;
            msg.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Уведомляем отправителей о прочтении
        await Clients.Group($"conversation_{conversationId}").SendAsync("MessagesRead", conversationId, userId);
    }
}
