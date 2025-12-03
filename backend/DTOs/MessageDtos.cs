namespace ZooPortal.Api.DTOs;

// === User DTOs ===

public record MessageUserDto(
    Guid Id,
    string Name
);

// === Message DTOs ===

public record MessageDto(
    Guid Id,
    Guid SenderId,
    string SenderName,
    string Text,
    bool IsRead,
    DateTime CreatedAt
);

public record SendMessageRequest(
    string Text
);

// === Conversation DTOs ===

public record ConversationListDto(
    Guid Id,
    MessageUserDto OtherUser,
    string? LastMessageText,
    DateTime? LastMessageAt,
    int UnreadCount,
    ConversationContextDto? Context
);

public record ConversationDetailDto(
    Guid Id,
    MessageUserDto OtherUser,
    ConversationContextDto? Context,
    List<MessageDto> Messages
);

public record ConversationContextDto(
    string Type, // "listing" | "lostFound"
    Guid Id,
    string Title,
    string? ImageUrl
);

public record StartConversationRequest(
    Guid UserId,
    Guid? ListingId,
    Guid? LostFoundId,
    string? InitialMessage
);

// === Unread count ===

public record UnreadCountDto(
    int Count
);
