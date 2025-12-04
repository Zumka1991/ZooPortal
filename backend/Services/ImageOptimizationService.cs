using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace ZooPortal.Api.Services;

public interface IImageOptimizationService
{
    Task<string> OptimizeAndSaveAsync(Stream inputStream, string fileName, string directory, int maxWidth = 1920, int quality = 85);
}

public class ImageOptimizationService : IImageOptimizationService
{
    private readonly IWebHostEnvironment _environment;

    public ImageOptimizationService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> OptimizeAndSaveAsync(Stream inputStream, string fileName, string directory, int maxWidth = 1920, int quality = 85)
    {
        // Загрузить изображение
        using var image = await Image.LoadAsync(inputStream);

        // Изменить размер если больше maxWidth
        if (image.Width > maxWidth)
        {
            var height = (int)((double)maxWidth / image.Width * image.Height);
            image.Mutate(x => x.Resize(maxWidth, height));
        }

        // Создать директорию если не существует
        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", directory);
        Directory.CreateDirectory(uploadsPath);

        // Сохранить с оптимизацией
        var filePath = Path.Combine(uploadsPath, fileName);

        var encoder = new JpegEncoder
        {
            Quality = quality
        };

        await image.SaveAsync(filePath, encoder);

        return fileName;
    }
}
