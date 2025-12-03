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
    public DbSet<City> Cities => Set<City>();
    public DbSet<ShelterImage> ShelterImages => Set<ShelterImage>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<ListingLike> ListingLikes => Set<ListingLike>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();

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

        // City
        modelBuilder.Entity<City>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Region).HasMaxLength(100);
        });

        // Shelter
        modelBuilder.Entity<Shelter>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.ShortDescription).HasMaxLength(500);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Phone2).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Website).HasMaxLength(500);
            entity.Property(e => e.VkUrl).HasMaxLength(500);
            entity.Property(e => e.TelegramUrl).HasMaxLength(500);
            entity.Property(e => e.InstagramUrl).HasMaxLength(500);
            entity.Property(e => e.WorkingHours).HasMaxLength(200);
            entity.Property(e => e.DonationCardNumber).HasMaxLength(50);
            entity.Property(e => e.DonationCardHolder).HasMaxLength(100);
            entity.Property(e => e.DonationPhone).HasMaxLength(20);
            entity.Property(e => e.ModerationComment).HasMaxLength(500);

            entity.HasOne(e => e.City)
                .WithMany(c => c.Shelters)
                .HasForeignKey(e => e.CityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Owner)
                .WithMany()
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ModeratedBy)
                .WithMany()
                .HasForeignKey(e => e.ModeratedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ShelterImage
        modelBuilder.Entity<ShelterImage>(entity =>
        {
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.FileName).HasMaxLength(255);

            entity.HasOne(e => e.Shelter)
                .WithMany(s => s.Images)
                .HasForeignKey(e => e.ShelterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Listing
        modelBuilder.Entity<Listing>(entity =>
        {
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.Property(e => e.ModerationComment).HasMaxLength(500);

            entity.HasOne(e => e.City)
                .WithMany()
                .HasForeignKey(e => e.CityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Listings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Shelter)
                .WithMany(s => s.Listings)
                .HasForeignKey(e => e.ShelterId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ModeratedBy)
                .WithMany()
                .HasForeignKey(e => e.ModeratedById)
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
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(100);
            entity.Property(e => e.DistinctiveFeatures).HasMaxLength(500);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.Property(e => e.ModerationComment).HasMaxLength(500);

            entity.HasOne(e => e.City)
                .WithMany()
                .HasForeignKey(e => e.CityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                .WithMany(u => u.LostFoundPosts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ModeratedBy)
                .WithMany()
                .HasForeignKey(e => e.ModeratedById)
                .OnDelete(DeleteBehavior.SetNull);
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

        // Favorite
        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.ListingId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.Favorites)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Listing)
                .WithMany()
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ListingLike
        modelBuilder.Entity<ListingLike>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.ListingId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.ListingLikes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.Likes)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Conversation
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.Property(e => e.LastMessageText).HasMaxLength(500);

            // Уникальный индекс на пару участников
            entity.HasIndex(e => new { e.User1Id, e.User2Id });

            entity.HasOne(e => e.User1)
                .WithMany()
                .HasForeignKey(e => e.User1Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User2)
                .WithMany()
                .HasForeignKey(e => e.User2Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Listing)
                .WithMany()
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.LostFound)
                .WithMany()
                .HasForeignKey(e => e.LostFoundId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Message
        modelBuilder.Entity<Message>(entity =>
        {
            entity.Property(e => e.Text).HasMaxLength(2000);

            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sender)
                .WithMany()
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => new { e.ConversationId, e.CreatedAt });
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
