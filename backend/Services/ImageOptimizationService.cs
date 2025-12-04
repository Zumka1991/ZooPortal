using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;

namespace ZooPortal.Api.Services;

public interface IImageOptimizationService
{
    Task<string> OptimizeAndSaveAsync(Stream inputStream, string fileName, string directory, int maxWidth = 1920, int quality = 85, bool preserveTransparency = false);
}

public class ImageOptimizationService : IImageOptimizationService
{
    private readonly IWebHostEnvironment _environment;

    public ImageOptimizationService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> OptimizeAndSaveAsync(Stream inputStream, string fileName, string directory, int maxWidth = 1920, int quality = 85, bool preserveTransparency = false)
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

        // Если нужно сохранить прозрачность и изображение имеет альфа-канал - сохраняем как PNG
        if (preserveTransparency && HasTransparency(image))
        {
            var pngEncoder = new PngEncoder
            {
                CompressionLevel = PngCompressionLevel.BestCompression
            };
            await image.SaveAsync(filePath, pngEncoder);
        }
        else
        {
            // Иначе сохраняем как JPEG
            var jpegEncoder = new JpegEncoder
            {
                Quality = quality
            };
            await image.SaveAsync(filePath, jpegEncoder);
        }

        return fileName;
    }

    private static bool HasTransparency(Image image)
    {
        // Проверяем, есть ли альфа-канал в изображении
        return image.Metadata.GetFormatMetadata(PngFormat.Instance) != null ||
               image.PixelType.AlphaRepresentation != SixLabors.ImageSharp.PixelFormats.PixelAlphaRepresentation.None;
    }
}
