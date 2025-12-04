using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// === Request DTOs ===

public record CreateListingRequest(
    string Title,
    string Description,
    AnimalType AnimalType,
    string? Breed,
    int? Age,
    Gender? Gender,
    ListingType Type,
    decimal? Price,
    Guid CityId,
    string? ContactPhone,
    Guid? ShelterId,
    Guid? PetId
);

public record UpdateListingRequest(
    string Title,
    string Description,
    AnimalType AnimalType,
    string? Breed,
    int? Age,
    Gender? Gender,
    ListingType Type,
    decimal? Price,
    Guid CityId,
    string? ContactPhone,
    Guid? PetId
);

public record ModerateListingRequest(
    ModerationStatus Status,
    string? Comment
);

public record BulkModerateRequest(
    List<Guid> Ids,
    string? Comment
);

// === Response DTOs ===

public record ListingOwnerDto(
    Guid Id,
    string Name
);

public record ListingShelterDto(
    Guid Id,
    string Name,
    string? LogoUrl,
    bool IsVerified
);

public record ListingImageDto(
    Guid Id,
    string Url,
    int Order
);

public record ListingCityDto(
    Guid Id,
    string Name,
    string? Region
);

// Для списка (каталога)
public record ListingListDto(
    Guid Id,
    string Title,
    AnimalType AnimalType,
    string? Breed,
    int? Age,
    Gender? Gender,
    ListingType Type,
    decimal? Price,
    ListingCityDto City,
    string? MainImageUrl,
    ListingStatus Status,
    ModerationStatus ModerationStatus,
    bool IsFavorite,
    int LikesCount,
    bool IsLiked,
    ListingShelterDto? Shelter,
    DateTime CreatedAt,
    DateTime ExpiresAt
);

// Для детальной страницы
public record ListingDetailDto(
    Guid Id,
    string Title,
    string Description,
    AnimalType AnimalType,
    string? Breed,
    int? Age,
    Gender? Gender,
    ListingType Type,
    decimal? Price,
    ListingCityDto City,
    ListingStatus Status,
    ModerationStatus ModerationStatus,
    string? ModerationComment,
    DateTime? ModeratedAt,
    bool IsFavorite,
    int LikesCount,
    bool IsLiked,
    ListingOwnerDto Owner,
    ListingShelterDto? Shelter,
    List<ListingImageDto> Images,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime? UpdatedAt,
    string? ContactPhone
);

// Для показа контакта
public record ShowContactResponse(
    string? ContactPhone
);

// === Paged Responses ===

public record ListingsPagedResponse(
    List<ListingListDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record AdminListingsPagedResponse(
    List<ListingDetailDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    int PendingCount,
    int ApprovedCount,
    int RejectedCount,
    int ExpiredCount
);
