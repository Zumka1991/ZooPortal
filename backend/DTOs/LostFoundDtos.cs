using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// === Public DTOs ===

public record LostFoundListDto(
    Guid Id,
    string Title,
    LostFoundType Type,
    AnimalType AnimalType,
    string? Breed,
    string? Color,
    CityDto City,
    string? Address,
    double? Latitude,
    double? Longitude,
    DateTime EventDate,
    LostFoundStatus Status,
    string? MainImageUrl,
    DateTime CreatedAt
);

public record LostFoundDetailDto(
    Guid Id,
    string Title,
    string Description,
    LostFoundType Type,
    AnimalType AnimalType,
    string? Breed,
    string? Color,
    string? DistinctiveFeatures,
    CityDto City,
    string? Address,
    double? Latitude,
    double? Longitude,
    DateTime EventDate,
    string? ContactPhone,
    LostFoundStatus Status,
    ModerationStatus ModerationStatus,
    string? ModerationComment,
    LostFoundUserDto User,
    List<LostFoundImageDto> Images,
    DateTime CreatedAt
);

public record LostFoundUserDto(
    Guid Id,
    string Name
);

public record LostFoundImageDto(
    Guid Id,
    string Url,
    int Order
);

public record CreateLostFoundRequest(
    string Title,
    string Description,
    LostFoundType Type,
    AnimalType AnimalType,
    string? Breed,
    string? Color,
    string? DistinctiveFeatures,
    Guid CityId,
    string? Address,
    double? Latitude,
    double? Longitude,
    DateTime EventDate,
    string? ContactPhone
);

public record UpdateLostFoundRequest(
    string Title,
    string Description,
    AnimalType AnimalType,
    string? Breed,
    string? Color,
    string? DistinctiveFeatures,
    Guid CityId,
    string? Address,
    double? Latitude,
    double? Longitude,
    DateTime EventDate,
    string? ContactPhone
);

public record LostFoundPagedResponse(
    List<LostFoundListDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

// === My Lost/Found DTOs ===

public record MyLostFoundDto(
    Guid Id,
    string Title,
    LostFoundType Type,
    AnimalType AnimalType,
    CityDto City,
    DateTime EventDate,
    LostFoundStatus Status,
    ModerationStatus ModerationStatus,
    string? ModerationComment,
    string? MainImageUrl,
    DateTime CreatedAt
);

// === Admin DTOs ===

public record AdminLostFoundListDto(
    Guid Id,
    string Title,
    LostFoundType Type,
    AnimalType AnimalType,
    string? Breed,
    CityDto City,
    DateTime EventDate,
    LostFoundStatus Status,
    ModerationStatus ModerationStatus,
    string? ModerationComment,
    AdminLostFoundUserDto User,
    string? MainImageUrl,
    DateTime CreatedAt
);

public record AdminLostFoundUserDto(
    Guid Id,
    string Name,
    string Email
);

public record AdminLostFoundDetailDto(
    Guid Id,
    string Title,
    string Description,
    LostFoundType Type,
    AnimalType AnimalType,
    string? Breed,
    string? Color,
    string? DistinctiveFeatures,
    CityDto City,
    string? Address,
    double? Latitude,
    double? Longitude,
    DateTime EventDate,
    string? ContactPhone,
    LostFoundStatus Status,
    ModerationStatus ModerationStatus,
    string? ModerationComment,
    DateTime? ModeratedAt,
    AdminLostFoundUserDto User,
    List<LostFoundImageDto> Images,
    DateTime CreatedAt
);

public record AdminLostFoundPagedResponse(
    List<AdminLostFoundListDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    int PendingCount,
    int ApprovedCount,
    int RejectedCount
);
