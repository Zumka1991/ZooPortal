using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// Request DTOs
public record UploadGalleryImageRequest(string Title);

public record ModerateImageRequest(ModerationStatus Status, string? Comment);

// Response DTOs
public record GalleryImageDto(
    Guid Id,
    string Title,
    string ImageUrl,
    ModerationStatus Status,
    DateTime CreatedAt,
    GalleryUserDto User
);

public record GalleryImageDetailDto(
    Guid Id,
    string Title,
    string ImageUrl,
    string? FileName,
    ModerationStatus Status,
    string? ModerationComment,
    DateTime? ModeratedAt,
    GalleryUserDto? ModeratedBy,
    DateTime CreatedAt,
    GalleryUserDto User
);

public record GalleryUserDto(Guid Id, string Name);

public record GalleryPagedResponse(
    List<GalleryImageDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

// Admin response with more details
public record AdminGalleryPagedResponse(
    List<GalleryImageDetailDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages,
    int PendingCount,
    int ApprovedCount,
    int RejectedCount
);
