using System.ComponentModel.DataAnnotations;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.DTOs;

// Request DTOs
public record CreateArticleRequest(
    [Required][MaxLength(200)] string Title,
    [Required] string Content,
    [MaxLength(500)] string? Summary,
    string? ImageUrl,
    [Required] ArticleCategory Category,
    AnimalType? AnimalType,
    bool IsPublished = false
);

public record UpdateArticleRequest(
    [Required][MaxLength(200)] string Title,
    [Required] string Content,
    [MaxLength(500)] string? Summary,
    string? ImageUrl,
    [Required] ArticleCategory Category,
    AnimalType? AnimalType,
    bool IsPublished
);

// Response DTOs
public record ArticleDto(
    Guid Id,
    string Title,
    string Slug,
    string Content,
    string? Summary,
    string? ImageUrl,
    string Category,
    string? AnimalType,
    bool IsPublished,
    DateTime? PublishedAt,
    int ViewCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    AuthorDto Author
);

public record ArticleListDto(
    Guid Id,
    string Title,
    string Slug,
    string? Summary,
    string? ImageUrl,
    string Category,
    string? AnimalType,
    bool IsPublished,
    DateTime? PublishedAt,
    int ViewCount,
    DateTime CreatedAt,
    AuthorDto Author
);

public record AuthorDto(
    Guid Id,
    string Name,
    string? AvatarUrl
);

public record ArticlesPagedResponse(
    List<ArticleListDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);
