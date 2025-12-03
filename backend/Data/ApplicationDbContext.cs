using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Shelter> Shelters => Set<Shelter>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    public DbSet<LostFound> LostFoundPosts => Set<LostFound>();
    public DbSet<LostFoundImage> LostFoundImages => Set<LostFoundImage>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<GalleryImage> GalleryImages => Set<GalleryImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        // Shelter
        modelBuilder.Entity<Shelter>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(256);
        });

        // Listing
        modelBuilder.Entity<Listing>(entity =>
        {
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.Property(e => e.Price).HasPrecision(18, 2);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Listings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Shelter)
                .WithMany(s => s.Listings)
                .HasForeignKey(e => e.ShelterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ListingImage
        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.HasOne(e => e.Listing)
                .WithMany(l => l.Images)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LostFound
        modelBuilder.Entity<LostFound>(entity =>
        {
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(100);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);

            entity.HasOne(e => e.User)
                .WithMany(u => u.LostFoundPosts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LostFoundImage
        modelBuilder.Entity<LostFoundImage>(entity =>
        {
            entity.HasOne(e => e.LostFound)
                .WithMany(l => l.Images)
                .HasForeignKey(e => e.LostFoundId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Article
        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Slug).HasMaxLength(200);
            entity.Property(e => e.Summary).HasMaxLength(500);

            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // GalleryImage
        modelBuilder.Entity<GalleryImage>(entity =>
        {
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.ModerationComment).HasMaxLength(500);

            entity.HasOne(e => e.User)
                .WithMany(u => u.GalleryImages)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ModeratedBy)
                .WithMany()
                .HasForeignKey(e => e.ModeratedById)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
