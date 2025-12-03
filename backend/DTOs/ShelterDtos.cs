using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// City DTOs
public record CityDto(Guid Id, string Name, string? Region);

public record CreateCityRequest(string Name, string? Region);

// Shelter Request DTOs
public record CreateShelterRequest(
    string Name,
    string Description,
    string? ShortDescription,
    Guid CityId,
    string Address,
    double? Latitude,
    double? Longitude,
    string? Phone,
    string? Phone2,
    string? Email,
    string? Website,
    string? VkUrl,
    string? TelegramUrl,
    string? InstagramUrl,
    int DogsCount,
    int CatsCount,
    int OtherAnimalsCount,
    int? FoundedYear,
    int? VolunteersCount,
    string? WorkingHours,
    bool AcceptsVolunteers,
    string? Needs,
    string? DonationCardNumber,
    string? DonationCardHolder,
    string? DonationPhone,
    string? DonationDetails
);

public record UpdateShelterRequest(
    string Name,
    string Description,
    string? ShortDescription,
    Guid CityId,
    string Address,
    double? Latitude,
    double? Longitude,
    string? Phone,
    string? Phone2,
    string? Email,
    string? Website,
    string? VkUrl,
    string? TelegramUrl,
    string? InstagramUrl,
    int DogsCount,
    int CatsCount,
    int OtherAnimalsCount,
    int? FoundedYear,
    int? VolunteersCount,
    string? WorkingHours,
    bool AcceptsVolunteers,
    string? Needs,
    string? DonationCardNumber,
    string? DonationCardHolder,
    string? DonationPhone,
    string? DonationDetails
);

// Shelter Response DTOs
public record ShelterImageDto(Guid Id, string ImageUrl, bool IsMain, int SortOrder);

public record ShelterOwnerDto(Guid Id, string Name);

public record ShelterListDto(
    Guid Id,
    string Name,
    string? ShortDescription,
    string? LogoUrl,
    CityDto City,
    string Address,
    string? Phone,
    int TotalAnimals,
    int DogsCount,
    int CatsCount,
    bool IsVerified,
    ModerationStatus ModerationStatus,
    DateTime CreatedAt
);

public record ShelterDetailDto(
    Guid Id,
    string Name,
    string Description,
    string? ShortDescription,
    string? LogoUrl,
    CityDto City,
    string Address,
    double? Latitude,
    double? Longitude,
    string? Phone,
    string? Phone2,
    string? Email,
    string? Website,
    string? VkUrl,
    string? TelegramUrl,
    string? InstagramUrl,
    int DogsCount,
    int CatsCount,
    int OtherAnimalsCount,
    int TotalAnimals,
    int? FoundedYear,
    int? VolunteersCount,
    string? WorkingHours,
    bool AcceptsVolunteers,
    string? Needs,
    string? DonationCardNumber,
    string? DonationCardHolder,
    string? DonationPhone,
    string? DonationDetails,
    bool IsVerified,
    bool IsActive,
    ModerationStatus ModerationStatus,
    string? ModerationComment,
    DateTime? ModeratedAt,
    ShelterOwnerDto? Owner,
    List<ShelterImageDto> Images,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record SheltersPagedResponse(
    List<ShelterListDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

// Admin response with counts
public record AdminSheltersPagedResponse(
    List<ShelterDetailDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    int PendingCount,
    int ApprovedCount,
    int RejectedCount
);

public record ModeratorDto(Guid Id, string Name);

public record ModerateShelterRequest(ModerationStatus Status, string? Comment);
