using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// Request DTOs
public record CreateStaticPageRequest(
    string Slug,
    string Title,
    string Content,
    string? MetaDescription,
    bool IsPublished = true
);

public record UpdateStaticPageRequest(
    string Title,
    string Content,
    string? MetaDescription,
    bool IsPublished
);

// Response DTOs
public record StaticPageDto(
    Guid Id,
    string Slug,
    string Title,
    string Content,
    string? MetaDescription,
    bool IsPublished,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    EditorDto? LastEditedBy
);

public record StaticPageListDto(
    Guid Id,
    string Slug,
    string Title,
    bool IsPublished,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record EditorDto(Guid Id, string Name);

public record StaticPagesListResponse(
    List<StaticPageListDto> Items,
    int TotalCount
);
