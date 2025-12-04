using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZooPortal.Api.Services;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Moderator")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IImageOptimizationService _imageOptimization;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB (до оптимизации)

    public UploadController(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        IImageOptimizationService imageOptimization)
    {
        _environment = environment;
        _configuration = configuration;
        _imageOptimization = imageOptimization;
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
            return BadRequest(new { message = "Размер файла не должен превышать 10MB" });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Разрешены только изображения: jpg, jpeg, png, gif, webp" });
        }

        // Generate unique filename (always save as .jpg after optimization)
        var fileName = $"{Guid.NewGuid()}.jpg";

        // Optimize and save
        await using var inputStream = file.OpenReadStream();
        await _imageOptimization.OptimizeAndSaveAsync(inputStream, fileName, "images", maxWidth: 1920, quality: 85);

        // Build URL
        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var imageUrl = $"{baseUrl}/uploads/images/{fileName}";

        // Get optimized file size
        var filePath = Path.Combine(_environment.ContentRootPath, "uploads", "images", fileName);
        var fileInfo = new FileInfo(filePath);

        return Ok(new UploadResult(imageUrl, fileName, fileInfo.Length));
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
