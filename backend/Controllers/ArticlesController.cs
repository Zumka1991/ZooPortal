using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/articles")]
public class ArticlesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ArticlesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ArticlesPagedResponse>> GetArticles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] ArticleCategory? category = null,
        [FromQuery] AnimalType? animalType = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Articles
            .Include(a => a.Author)
            .Where(a => a.IsPublished)
            .AsQueryable();

        if (category.HasValue)
            query = query.Where(a => a.Category == category.Value);

        if (animalType.HasValue)
            query = query.Where(a => a.AnimalType == animalType.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(a => a.Title.Contains(search) || (a.Summary != null && a.Summary.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(a => a.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleListDto(
                a.Id,
                a.Title,
                a.Slug,
                a.Summary,
                a.ImageUrl,
                a.Category.ToString(),
                a.AnimalType.HasValue ? a.AnimalType.Value.ToString() : null,
                a.IsPublished,
                a.PublishedAt,
                a.ViewCount,
                a.CreatedAt,
                new AuthorDto(a.Author.Id, a.Author.Name, a.Author.AvatarUrl)
            ))
            .ToListAsync();

        return Ok(new ArticlesPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ArticleDto>> GetArticleBySlug(string slug)
    {
        var article = await _context.Articles
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Slug == slug && a.IsPublished);

        if (article == null)
            return NotFound();

        // Increment view count
        article.ViewCount++;
        await _context.SaveChangesAsync();

        return Ok(new ArticleDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.Summary,
            article.ImageUrl,
            article.Category.ToString(),
            article.AnimalType?.ToString(),
            article.IsPublished,
            article.PublishedAt,
            article.ViewCount,
            article.CreatedAt,
            article.UpdatedAt,
            new AuthorDto(article.Author.Id, article.Author.Name, article.Author.AvatarUrl)
        ));
    }

    [HttpGet("categories")]
    public ActionResult<string[]> GetCategories()
    {
        var categories = Enum.GetNames<ArticleCategory>();
        return Ok(categories);
    }

    [HttpGet("recent")]
    public async Task<ActionResult<List<ArticleListDto>>> GetRecentArticles([FromQuery] int count = 5)
    {
        var articles = await _context.Articles
            .Include(a => a.Author)
            .Where(a => a.IsPublished)
            .OrderByDescending(a => a.PublishedAt)
            .Take(count)
            .Select(a => new ArticleListDto(
                a.Id,
                a.Title,
                a.Slug,
                a.Summary,
                a.ImageUrl,
                a.Category.ToString(),
                a.AnimalType.HasValue ? a.AnimalType.Value.ToString() : null,
                a.IsPublished,
                a.PublishedAt,
                a.ViewCount,
                a.CreatedAt,
                new AuthorDto(a.Author.Id, a.Author.Name, a.Author.AvatarUrl)
            ))
            .ToListAsync();

        return Ok(articles);
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<ArticleListDto>>> GetPopularArticles([FromQuery] int count = 5)
    {
        var articles = await _context.Articles
            .Include(a => a.Author)
            .Where(a => a.IsPublished)
            .OrderByDescending(a => a.ViewCount)
            .Take(count)
            .Select(a => new ArticleListDto(
                a.Id,
                a.Title,
                a.Slug,
                a.Summary,
                a.ImageUrl,
                a.Category.ToString(),
                a.AnimalType.HasValue ? a.AnimalType.Value.ToString() : null,
                a.IsPublished,
                a.PublishedAt,
                a.ViewCount,
                a.CreatedAt,
                new AuthorDto(a.Author.Id, a.Author.Name, a.Author.AvatarUrl)
            ))
            .ToListAsync();

        return Ok(articles);
    }
}
