using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<FriendshipEntity> Friendships => Set<FriendshipEntity>();
    public DbSet<PostEntity> Posts => Set<PostEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>().HasIndex(x => x.Email).IsUnique();

        modelBuilder.Entity<FriendshipEntity>()
            .HasOne(x => x.Requester)
            .WithMany()
            .HasForeignKey(x => x.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FriendshipEntity>()
            .HasOne(x => x.Addressee)
            .WithMany()
            .HasForeignKey(x => x.AddresseeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PostEntity>()
            .HasOne(x => x.Author)
            .WithMany()
            .HasForeignKey(x => x.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserEntity
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class FriendshipEntity
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public UserEntity? Requester { get; set; }
    public Guid AddresseeId { get; set; }
    public UserEntity? Addressee { get; set; }
    public string Status { get; set; } = "pending";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RespondedAt { get; set; }
}

public class PostEntity
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public UserEntity? Author { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ImageUrlsJson { get; set; } = "[]";
    public DateTimeOffset CreatedAt { get; set; }
}
