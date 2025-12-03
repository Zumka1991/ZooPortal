namespace ZooPortal.Api.DTOs;

// === Admin City DTOs ===

public record AdminCreateCityRequest(
    string Name,
    string? Region
);

public record AdminUpdateCityRequest(
    string Name,
    string? Region,
    bool IsActive
);

public record AdminCityDto(
    Guid Id,
    string Name,
    string? Region,
    bool IsActive,
    int SheltersCount,
    int ListingsCount,
    DateTime CreatedAt
);

public record AdminCitiesPagedResponse(
    List<AdminCityDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record SeedCitiesResponse(
    int AddedCount,
    int TotalCount,
    string Message
);
