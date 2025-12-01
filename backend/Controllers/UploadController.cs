using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Moderator")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public UploadController(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _environment = environment;
        _configuration = configuration;
    }

    [HttpPost("image")]
    public async Task<ActionResult<UploadResult>> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Файл не выбран" });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new { message = "Размер файла не должен превышать 5MB" });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Разрешены только изображения: jpg, jpeg, png, gif, webp" });
        }

        // Create uploads directory
        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "images");
        Directory.CreateDirectory(uploadsPath);

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        // Save file
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        // Build URL
        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var imageUrl = $"{baseUrl}/uploads/images/{fileName}";

        return Ok(new UploadResult(imageUrl, fileName, file.Length));
    }

    [HttpDelete("image/{fileName}")]
    public ActionResult DeleteImage(string fileName)
    {
        // Validate filename (prevent path traversal)
        if (fileName.Contains("..") || fileName.Contains('/') || fileName.Contains('\\'))
        {
            return BadRequest(new { message = "Недопустимое имя файла" });
        }

        var filePath = Path.Combine(_environment.ContentRootPath, "uploads", "images", fileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Файл не найден" });
        }

        System.IO.File.Delete(filePath);
        return Ok(new { message = "Файл удалён" });
    }
}

public record UploadResult(string Url, string FileName, long Size);
