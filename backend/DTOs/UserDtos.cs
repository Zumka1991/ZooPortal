using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

public record AdminUserDto(
    Guid Id,
    string Email,
    string Name,
    string? Phone,
    string? AvatarUrl,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt
);

public record AdminUserDetailDto(
    Guid Id,
    string Email,
    string Name,
    string? Phone,
    string? AvatarUrl,
    UserRole Role,
    bool IsActive,
    int ListingsCount,
    int GalleryImagesCount,
    int LostFoundPostsCount,
    int SheltersCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record UsersPagedResponse(
    List<AdminUserDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record UpdateUserRoleRequest(UserRole Role);

public record UpdateUserStatusRequest(bool IsActive);
