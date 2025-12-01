using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/articles")]
[Authorize(Roles = "Admin,Moderator")]
public partial class AdminArticlesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminArticlesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ArticlesPagedResponse>> GetArticles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] ArticleCategory? category = null,
        [FromQuery] bool? isPublished = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Articles
            .Include(a => a.Author)
            .AsQueryable();

        if (category.HasValue)
            query = query.Where(a => a.Category == category.Value);

        if (isPublished.HasValue)
            query = query.Where(a => a.IsPublished == isPublished.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(a => a.Title.Contains(search) || (a.Summary != null && a.Summary.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ArticleDto>> GetArticle(Guid id)
    {
        var article = await _context.Articles
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
            return NotFound();

        return Ok(MapToDto(article));
    }

    [HttpPost]
    public async Task<ActionResult<ArticleDto>> CreateArticle(CreateArticleRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var slug = GenerateSlug(request.Title);

        // Ensure slug is unique
        var baseSlug = slug;
        var counter = 1;
        while (await _context.Articles.AnyAsync(a => a.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var article = new Article
        {
            Title = request.Title,
            Slug = slug,
            Content = request.Content,
            Summary = request.Summary,
            ImageUrl = request.ImageUrl,
            Category = request.Category,
            AnimalType = request.AnimalType,
            IsPublished = request.IsPublished,
            PublishedAt = request.IsPublished ? DateTime.UtcNow : null,
            AuthorId = userId.Value
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Reload with Author
        await _context.Entry(article).Reference(a => a.Author).LoadAsync();

        return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, MapToDto(article));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ArticleDto>> UpdateArticle(Guid id, UpdateArticleRequest request)
    {
        var article = await _context.Articles
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
            return NotFound();

        // Update slug if title changed
        if (article.Title != request.Title)
        {
            var newSlug = GenerateSlug(request.Title);
            var baseSlug = newSlug;
            var counter = 1;
            while (await _context.Articles.AnyAsync(a => a.Slug == newSlug && a.Id != id))
            {
                newSlug = $"{baseSlug}-{counter++}";
            }
            article.Slug = newSlug;
        }

        article.Title = request.Title;
        article.Content = request.Content;
        article.Summary = request.Summary;
        article.ImageUrl = request.ImageUrl;
        article.Category = request.Category;
        article.AnimalType = request.AnimalType;

        // Handle publish state change
        if (!article.IsPublished && request.IsPublished)
        {
            article.PublishedAt = DateTime.UtcNow;
        }
        article.IsPublished = request.IsPublished;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(article));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteArticle(Guid id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null)
            return NotFound();

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<ArticleDto>> PublishArticle(Guid id)
    {
        var article = await _context.Articles
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
            return NotFound();

        if (!article.IsPublished)
        {
            article.IsPublished = true;
            article.PublishedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(MapToDto(article));
    }

    [HttpPost("{id:guid}/unpublish")]
    public async Task<ActionResult<ArticleDto>> UnpublishArticle(Guid id)
    {
        var article = await _context.Articles
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
            return NotFound();

        article.IsPublished = false;
        await _context.SaveChangesAsync();

        return Ok(MapToDto(article));
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private static string GenerateSlug(string title)
    {
        // Transliterate Cyrillic to Latin
        var transliterated = TransliterateCyrillic(title);

        // Convert to lowercase and replace spaces/special chars with hyphens
        var slug = SlugRegex().Replace(transliterated.ToLower(), "-");

        // Remove multiple consecutive hyphens
        slug = MultipleHyphensRegex().Replace(slug, "-");

        // Trim hyphens from start and end
        return slug.Trim('-');
    }

    private static string TransliterateCyrillic(string text)
    {
        var map = new Dictionary<char, string>
        {
            {'а', "a"}, {'б', "b"}, {'в', "v"}, {'г', "g"}, {'д', "d"}, {'е', "e"}, {'ё', "yo"},
            {'ж', "zh"}, {'з', "z"}, {'и', "i"}, {'й', "y"}, {'к', "k"}, {'л', "l"}, {'м', "m"},
            {'н', "n"}, {'о', "o"}, {'п', "p"}, {'р', "r"}, {'с', "s"}, {'т', "t"}, {'у', "u"},
            {'ф', "f"}, {'х', "h"}, {'ц', "ts"}, {'ч', "ch"}, {'ш', "sh"}, {'щ', "sch"},
            {'ъ', ""}, {'ы', "y"}, {'ь', ""}, {'э', "e"}, {'ю', "yu"}, {'я', "ya"},
            {'А', "A"}, {'Б', "B"}, {'В', "V"}, {'Г', "G"}, {'Д', "D"}, {'Е', "E"}, {'Ё', "Yo"},
            {'Ж', "Zh"}, {'З', "Z"}, {'И', "I"}, {'Й', "Y"}, {'К', "K"}, {'Л', "L"}, {'М', "M"},
            {'Н', "N"}, {'О', "O"}, {'П', "P"}, {'Р', "R"}, {'С', "S"}, {'Т', "T"}, {'У', "U"},
            {'Ф', "F"}, {'Х', "H"}, {'Ц', "Ts"}, {'Ч', "Ch"}, {'Ш', "Sh"}, {'Щ', "Sch"},
            {'Ъ', ""}, {'Ы', "Y"}, {'Ь', ""}, {'Э', "E"}, {'Ю', "Yu"}, {'Я', "Ya"}
        };

        return string.Concat(text.Select(c => map.TryGetValue(c, out var replacement) ? replacement : c.ToString()));
    }

    private static ArticleDto MapToDto(Article article) => new(
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
    );

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex SlugRegex();

    [GeneratedRegex(@"-+")]
    private static partial Regex MultipleHyphensRegex();
}
