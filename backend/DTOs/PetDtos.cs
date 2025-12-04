using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// === Request DTOs ===

public record CreatePetRequest(
    string Name,
    string Description,
    AnimalType? AnimalType,
    string? Breed,
    Gender? Gender,
    DateTime? BirthDate,
    int? AgeMonths,
    bool IsPublic
);

public record UpdatePetRequest(
    string Name,
    string Description,
    AnimalType? AnimalType,
    string? Breed,
    Gender? Gender,
    DateTime? BirthDate,
    int? AgeMonths,
    bool IsPublic
);

public record CreatePetCommentRequest(
    string Text
);

// === Response DTOs ===

public record PetOwnerDto(
    Guid Id,
    string Name,
    string? AvatarUrl
);

public record PetImageDto(
    Guid Id,
    string ImageUrl,
    bool IsMain,
    int SortOrder
);

public record PetCommentDto(
    Guid Id,
    string Text,
    PetOwnerDto User,
    DateTime CreatedAt
);

// Для списка (каталога)
public record PetListDto(
    Guid Id,
    string Name,
    string Description,
    AnimalType? AnimalType,
    string? Breed,
    Gender? Gender,
    int? AgeMonths,
    string MainImageUrl,
    PetOwnerDto Owner,
    int LikesCount,
    bool IsLiked,
    DateTime CreatedAt
);

// Для детальной страницы
public record PetDetailDto(
    Guid Id,
    string Name,
    string Description,
    AnimalType? AnimalType,
    string? Breed,
    Gender? Gender,
    DateTime? BirthDate,
    int? AgeMonths,
    string MainImageUrl,
    bool IsPublic,
    PetOwnerDto Owner,
    List<PetImageDto> Images,
    int LikesCount,
    bool IsLiked,
    int CommentsCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

// === Paged Responses ===

public record PetsPagedResponse(
    List<PetListDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

// === User's Pet Response (для выбора в формах) ===

public record UserPetDto(
    Guid Id,
    string Name,
    AnimalType? AnimalType,
    string MainImageUrl
);
