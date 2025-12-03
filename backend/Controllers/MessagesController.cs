using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Hubs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public MessagesController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // GET: api/messages/conversations - Список диалогов
    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationListDto>>> GetConversations()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var conversations = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Listing).ThenInclude(l => l!.Images)
            .Include(c => c.LostFound).ThenInclude(l => l!.Images)
            .Where(c => c.User1Id == userId || c.User2Id == userId)
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToListAsync();

        var result = new List<ConversationListDto>();

        foreach (var conv in conversations)
        {
            var otherUser = conv.User1Id == userId ? conv.User2 : conv.User1;

            // Считаем непрочитанные сообщения
            var unreadCount = await _context.Messages
                .CountAsync(m => m.ConversationId == conv.Id && m.SenderId != userId && !m.IsRead);

            // Контекст (объявление или потеряшка)
            ConversationContextDto? context = null;
            if (conv.Listing != null)
            {
                context = new ConversationContextDto(
                    "listing",
                    conv.Listing.Id,
                    conv.Listing.Title,
                    conv.Listing.Images.OrderBy(i => i.Order).FirstOrDefault()?.Url
                );
            }
            else if (conv.LostFound != null)
            {
                context = new ConversationContextDto(
                    "lostFound",
                    conv.LostFound.Id,
                    conv.LostFound.Title,
                    conv.LostFound.Images.OrderBy(i => i.Order).FirstOrDefault()?.Url
                );
            }

            result.Add(new ConversationListDto(
                conv.Id,
                new MessageUserDto(otherUser.Id, otherUser.Name),
                conv.LastMessageText,
                conv.LastMessageAt,
                unreadCount,
                context
            ));
        }

        return Ok(result);
    }

    // GET: api/messages/conversations/{id} - Детали диалога с сообщениями
    [HttpGet("conversations/{id:guid}")]
    public async Task<ActionResult<ConversationDetailDto>> GetConversation(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var conversation = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Listing).ThenInclude(l => l!.Images)
            .Include(c => c.LostFound).ThenInclude(l => l!.Images)
            .FirstOrDefaultAsync(c => c.Id == id && (c.User1Id == userId || c.User2Id == userId));

        if (conversation == null)
            return NotFound(new { message = "Диалог не найден" });

        var otherUser = conversation.User1Id == userId ? conversation.User2 : conversation.User1;

        // Загружаем сообщения
        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageDto(
                m.Id,
                m.SenderId,
                m.Sender.Name,
                m.Text,
                m.IsRead,
                m.CreatedAt
            ))
            .ToListAsync();

        // Отмечаем сообщения как прочитанные
        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == id && m.SenderId != userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unreadMessages)
        {
            msg.IsRead = true;
            msg.ReadAt = DateTime.UtcNow;
        }

        if (unreadMessages.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        // Контекст
        ConversationContextDto? context = null;
        if (conversation.Listing != null)
        {
            context = new ConversationContextDto(
                "listing",
                conversation.Listing.Id,
                conversation.Listing.Title,
                conversation.Listing.Images.OrderBy(i => i.Order).FirstOrDefault()?.Url
            );
        }
        else if (conversation.LostFound != null)
        {
            context = new ConversationContextDto(
                "lostFound",
                conversation.LostFound.Id,
                conversation.LostFound.Title,
                conversation.LostFound.Images.OrderBy(i => i.Order).FirstOrDefault()?.Url
            );
        }

        return Ok(new ConversationDetailDto(
            conversation.Id,
            new MessageUserDto(otherUser.Id, otherUser.Name),
            context,
            messages
        ));
    }

    // POST: api/messages/conversations - Начать или найти диалог
    [HttpPost("conversations")]
    public async Task<ActionResult<ConversationDetailDto>> StartConversation([FromBody] StartConversationRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        if (request.UserId == userId)
            return BadRequest(new { message = "Нельзя создать диалог с самим собой" });

        // Проверяем, что пользователь существует
        var otherUser = await _context.Users.FindAsync(request.UserId);
        if (otherUser == null)
            return BadRequest(new { message = "Пользователь не найден" });

        // Ищем существующий диалог между этими пользователями
        var existingConversation = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Listing).ThenInclude(l => l!.Images)
            .Include(c => c.LostFound).ThenInclude(l => l!.Images)
            .FirstOrDefaultAsync(c =>
                ((c.User1Id == userId && c.User2Id == request.UserId) ||
                 (c.User1Id == request.UserId && c.User2Id == userId)) &&
                c.ListingId == request.ListingId &&
                c.LostFoundId == request.LostFoundId);

        if (existingConversation != null)
        {
            // Возвращаем существующий диалог
            return await GetConversation(existingConversation.Id);
        }

        // Проверяем объявление/потеряшку если указаны
        Listing? listing = null;
        LostFound? lostFound = null;

        if (request.ListingId.HasValue)
        {
            listing = await _context.Listings
                .Include(l => l.Images)
                .FirstOrDefaultAsync(l => l.Id == request.ListingId);
            if (listing == null)
                return BadRequest(new { message = "Объявление не найдено" });
        }

        if (request.LostFoundId.HasValue)
        {
            lostFound = await _context.LostFoundPosts
                .Include(l => l.Images)
                .FirstOrDefaultAsync(l => l.Id == request.LostFoundId);
            if (lostFound == null)
                return BadRequest(new { message = "Запись не найдена" });
        }

        // Создаем новый диалог
        var conversation = new Conversation
        {
            User1Id = userId,
            User2Id = request.UserId,
            ListingId = request.ListingId,
            LostFoundId = request.LostFoundId
        };

        _context.Conversations.Add(conversation);

        // Если есть начальное сообщение
        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            var message = new Message
            {
                ConversationId = conversation.Id,
                SenderId = userId,
                Text = request.InitialMessage.Trim()
            };

            conversation.LastMessageAt = DateTime.UtcNow;
            conversation.LastMessageText = request.InitialMessage.Length > 100
                ? request.InitialMessage[..100] + "..."
                : request.InitialMessage;

            _context.Messages.Add(message);
        }

        await _context.SaveChangesAsync();

        // Уведомляем получателя о новом диалоге
        var currentUser = await _context.Users.FindAsync(userId);
        await _hubContext.Clients.Group($"user_{request.UserId}").SendAsync("NewConversation", new
        {
            conversationId = conversation.Id,
            userId = userId,
            userName = currentUser?.Name,
            preview = conversation.LastMessageText
        });

        return await GetConversation(conversation.Id);
    }

    // POST: api/messages/conversations/{id}/messages - Отправить сообщение через REST
    [HttpPost("conversations/{id:guid}/messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(Guid id, [FromBody] SendMessageRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var conversation = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .FirstOrDefaultAsync(c => c.Id == id && (c.User1Id == userId || c.User2Id == userId));

        if (conversation == null)
            return NotFound(new { message = "Диалог не найден" });

        var sender = conversation.User1Id == userId ? conversation.User1 : conversation.User2;
        var receiverId = conversation.User1Id == userId ? conversation.User2Id : conversation.User1Id;

        var message = new Message
        {
            ConversationId = id,
            SenderId = userId,
            Text = request.Text.Trim()
        };

        _context.Messages.Add(message);

        conversation.LastMessageAt = DateTime.UtcNow;
        conversation.LastMessageText = request.Text.Length > 100 ? request.Text[..100] + "..." : request.Text;

        await _context.SaveChangesAsync();

        var messageDto = new MessageDto(
            message.Id,
            userId,
            sender.Name,
            message.Text,
            false,
            message.CreatedAt
        );

        // Отправляем через SignalR
        await _hubContext.Clients.Group($"conversation_{id}").SendAsync("ReceiveMessage", messageDto);
        await _hubContext.Clients.Group($"user_{receiverId}").SendAsync("NewMessage", new
        {
            conversationId = id,
            senderId = userId,
            senderName = sender.Name,
            preview = conversation.LastMessageText
        });

        return Ok(messageDto);
    }

    // GET: api/messages/unread-count - Количество непрочитанных
    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var count = await _context.Messages
            .Where(m =>
                (m.Conversation.User1Id == userId || m.Conversation.User2Id == userId) &&
                m.SenderId != userId &&
                !m.IsRead)
            .CountAsync();

        return Ok(new UnreadCountDto(count));
    }

    // GET: api/messages/conversation-with/{userId} - Найти диалог с пользователем
    [HttpGet("conversation-with/{otherUserId:guid}")]
    public async Task<ActionResult> GetConversationWith(Guid otherUserId, [FromQuery] Guid? listingId, [FromQuery] Guid? lostFoundId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c =>
                ((c.User1Id == userId && c.User2Id == otherUserId) ||
                 (c.User1Id == otherUserId && c.User2Id == userId)) &&
                c.ListingId == listingId &&
                c.LostFoundId == lostFoundId);

        if (conversation == null)
            return NotFound(new { message = "Диалог не найден" });

        return Ok(new { conversationId = conversation.Id });
    }
}
