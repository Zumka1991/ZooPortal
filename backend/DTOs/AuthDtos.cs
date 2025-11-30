using System.ComponentModel.DataAnnotations;

namespace ZooPortal.Api.DTOs;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required][MinLength(2)] string Name,
    string? Phone
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record RefreshTokenRequest(
    [Required] string RefreshToken
);

public record UserDto(
    Guid Id,
    string Email,
    string Name,
    string? Phone,
    string? AvatarUrl,
    string Role
);
