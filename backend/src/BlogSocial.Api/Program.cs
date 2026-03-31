using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy => policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetIsOriginAllowed(_ => true));
});
builder.Services.AddSingleton<AppState>();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");

app.MapGet("/", () => Results.Ok(new { service = "BlogSocial.Api", status = "ok" }));

app.MapPost("/api/auth/register", (RegisterRequest req, AppState state) =>
{
    if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.FullName))
        return Results.BadRequest(new { message = "Email, password, fullName are required." });

    if (state.Users.Values.Any(u => u.Email.Equals(req.Email, StringComparison.OrdinalIgnoreCase)))
        return Results.BadRequest(new { message = "Email already exists." });

    var user = new UserRecord
    {
        Id = Guid.NewGuid(),
        Email = req.Email.Trim().ToLowerInvariant(),
        FullName = req.FullName.Trim(),
        PasswordHash = PasswordHasher.Hash(req.Password),
        Bio = string.Empty,
        AvatarUrl = null,
        CreatedAt = DateTimeOffset.UtcNow
    };

    state.Users[user.Id] = user;
    var token = state.IssueToken(user.Id);
    return Results.Ok(new AuthResponse(token, ToUserDto(user)));
});

app.MapPost("/api/auth/login", (LoginRequest req, AppState state) =>
{
    var email = req.Email?.Trim() ?? string.Empty;
    var user = state.Users.Values.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
    if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Invalid credentials." });

    var token = state.IssueToken(user.Id);
    return Results.Ok(new AuthResponse(token, ToUserDto(user)));
});

app.MapGet("/api/auth/me", (HttpContext http, AppState state) =>
{
    var user = state.RequireUser(http);
    return user is null ? Results.Unauthorized() : Results.Ok(ToUserDto(user));
});

app.MapPatch("/api/users/me", (HttpContext http, UpdateProfileRequest req, AppState state) =>
{
    var user = state.RequireUser(http);
    if (user is null) return Results.Unauthorized();

    user.FullName = string.IsNullOrWhiteSpace(req.FullName) ? user.FullName : req.FullName.Trim();
    user.Bio = req.Bio?.Trim() ?? user.Bio;
    return Results.Ok(ToUserDto(user));
});

app.MapPost("/api/users/me/avatar", (HttpContext http, UpdateAvatarRequest req, AppState state) =>
{
    var user = state.RequireUser(http);
    if (user is null) return Results.Unauthorized();
    user.AvatarUrl = req.AvatarUrl?.Trim();
    return Results.Ok(ToUserDto(user));
});

app.MapGet("/api/users", (HttpContext http, string? q, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();

    var query = (q ?? string.Empty).Trim().ToLowerInvariant();
    var users = state.Users.Values
        .Where(u => u.Id != me.Id)
        .Where(u => string.IsNullOrEmpty(query) || u.FullName.ToLowerInvariant().Contains(query) || u.Email.Contains(query))
        .Select(u => new UserListItemDto(u.Id, u.Email, u.FullName, u.Bio, u.AvatarUrl, state.GetFriendshipStatus(me.Id, u.Id)))
        .ToList();

    return Results.Ok(users);
});

app.MapGet("/api/users/{userId:guid}", (HttpContext http, Guid userId, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    if (!state.Users.TryGetValue(userId, out var user)) return Results.NotFound();

    var areFriends = state.AreFriends(me.Id, userId);
    var posts = state.Posts.Values
        .Where(p => p.AuthorId == userId && (me.Id == userId || areFriends))
        .OrderByDescending(p => p.CreatedAt)
        .Select(p => state.ToPostDto(p))
        .ToList();

    return Results.Ok(new ProfileDetailsDto(ToUserDto(user), areFriends, posts));
});

app.MapPost("/api/friend-requests/{targetUserId:guid}", (HttpContext http, Guid targetUserId, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    if (!state.Users.ContainsKey(targetUserId)) return Results.NotFound();
    if (targetUserId == me.Id) return Results.BadRequest(new { message = "Cannot friend yourself." });
    if (state.AreFriends(me.Id, targetUserId)) return Results.BadRequest(new { message = "Already friends." });
    if (state.Friendships.Values.Any(f => f.Status == FriendshipStatus.Pending && ((f.RequesterId == me.Id && f.AddresseeId == targetUserId) || (f.RequesterId == targetUserId && f.AddresseeId == me.Id))))
        return Results.BadRequest(new { message = "Pending request already exists." });

    var fr = new FriendshipRecord
    {
        Id = Guid.NewGuid(),
        RequesterId = me.Id,
        AddresseeId = targetUserId,
        Status = FriendshipStatus.Pending,
        CreatedAt = DateTimeOffset.UtcNow
    };
    state.Friendships[fr.Id] = fr;
    return Results.Ok(state.ToFriendshipDto(fr));
});

app.MapPost("/api/friend-requests/{requestId:guid}/accept", (HttpContext http, Guid requestId, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    if (!state.Friendships.TryGetValue(requestId, out var fr)) return Results.NotFound();
    if (fr.AddresseeId != me.Id) return Results.Forbid();
    fr.Status = FriendshipStatus.Accepted;
    fr.RespondedAt = DateTimeOffset.UtcNow;
    return Results.Ok(state.ToFriendshipDto(fr));
});

app.MapPost("/api/friend-requests/{requestId:guid}/reject", (HttpContext http, Guid requestId, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    if (!state.Friendships.TryGetValue(requestId, out var fr)) return Results.NotFound();
    if (fr.AddresseeId != me.Id) return Results.Forbid();
    fr.Status = FriendshipStatus.Rejected;
    fr.RespondedAt = DateTimeOffset.UtcNow;
    return Results.Ok(state.ToFriendshipDto(fr));
});

app.MapGet("/api/friends", (HttpContext http, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();

    var friends = state.Friendships.Values
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == me.Id || f.AddresseeId == me.Id))
        .Select(f => f.RequesterId == me.Id ? state.Users[f.AddresseeId] : state.Users[f.RequesterId])
        .Select(ToUserDto)
        .ToList();

    return Results.Ok(friends);
});

app.MapGet("/api/friend-requests/incoming", (HttpContext http, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    return Results.Ok(state.Friendships.Values.Where(f => f.AddresseeId == me.Id && f.Status == FriendshipStatus.Pending).Select(state.ToFriendshipDto).ToList());
});

app.MapGet("/api/friend-requests/outgoing", (HttpContext http, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    return Results.Ok(state.Friendships.Values.Where(f => f.RequesterId == me.Id && f.Status == FriendshipStatus.Pending).Select(state.ToFriendshipDto).ToList());
});

app.MapPost("/api/posts", (HttpContext http, CreatePostRequest req, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();
    if (string.IsNullOrWhiteSpace(req.Content)) return Results.BadRequest(new { message = "Content is required." });

    var post = new PostRecord
    {
        Id = Guid.NewGuid(),
        AuthorId = me.Id,
        Content = req.Content.Trim(),
        ImageUrls = req.ImageUrls?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToList() ?? [],
        CreatedAt = DateTimeOffset.UtcNow
    };

    state.Posts[post.Id] = post;
    return Results.Ok(state.ToPostDto(post));
});

app.MapGet("/api/posts/feed", (HttpContext http, AppState state) =>
{
    var me = state.RequireUser(http);
    if (me is null) return Results.Unauthorized();

    var visibleAuthorIds = state.GetFriendIds(me.Id).Append(me.Id).ToHashSet();
    var feed = state.Posts.Values
        .Where(p => visibleAuthorIds.Contains(p.AuthorId))
        .OrderByDescending(p => p.CreatedAt)
        .Select(state.ToPostDto)
        .ToList();

    return Results.Ok(feed);
});

app.MapHub<SocialHub>("/hubs/social");

app.Run();

static UserDto ToUserDto(UserRecord user) => new(user.Id, user.Email, user.FullName, user.Bio, user.AvatarUrl, user.CreatedAt);

record RegisterRequest(string Email, string Password, string FullName);
record LoginRequest(string Email, string Password);
record UpdateProfileRequest(string? FullName, string? Bio);
record UpdateAvatarRequest(string? AvatarUrl);
record CreatePostRequest(string Content, List<string>? ImageUrls);
record AuthResponse(string AccessToken, UserDto User);
record UserDto(Guid Id, string Email, string FullName, string Bio, string? AvatarUrl, DateTimeOffset CreatedAt);
record UserListItemDto(Guid Id, string Email, string FullName, string Bio, string? AvatarUrl, string RelationshipStatus);
record PostDto(Guid Id, Guid AuthorId, string AuthorName, string? AuthorAvatarUrl, string Content, List<string> ImageUrls, DateTimeOffset CreatedAt);
record FriendshipDto(Guid Id, Guid RequesterId, Guid AddresseeId, string Status, DateTimeOffset CreatedAt, DateTimeOffset? RespondedAt);
record ProfileDetailsDto(UserDto User, bool AreFriends, List<PostDto> Posts);

enum FriendshipStatus { Pending, Accepted, Rejected }

class UserRecord
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

class FriendshipRecord
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public Guid AddresseeId { get; set; }
    public FriendshipStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RespondedAt { get; set; }
}

class PostRecord
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
}

class AppState
{
    public ConcurrentDictionary<Guid, UserRecord> Users { get; } = new();
    public ConcurrentDictionary<Guid, FriendshipRecord> Friendships { get; } = new();
    public ConcurrentDictionary<Guid, PostRecord> Posts { get; } = new();
    private ConcurrentDictionary<string, Guid> Tokens { get; } = new();

    public string IssueToken(Guid userId)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        Tokens[token] = userId;
        return token;
    }

    public UserRecord? RequireUser(HttpContext http)
    {
        var header = http.Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Bearer ")) return null;
        var token = header[7..].Trim();
        return Tokens.TryGetValue(token, out var userId) && Users.TryGetValue(userId, out var user) ? user : null;
    }

    public bool AreFriends(Guid a, Guid b) => Friendships.Values.Any(f => f.Status == FriendshipStatus.Accepted && ((f.RequesterId == a && f.AddresseeId == b) || (f.RequesterId == b && f.AddresseeId == a)));

    public IEnumerable<Guid> GetFriendIds(Guid userId) => Friendships.Values
        .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
        .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId);

    public string GetFriendshipStatus(Guid meId, Guid otherUserId)
    {
        var fr = Friendships.Values.FirstOrDefault(f => (f.RequesterId == meId && f.AddresseeId == otherUserId) || (f.RequesterId == otherUserId && f.AddresseeId == meId));
        if (fr is null) return "none";
        return fr.Status switch
        {
            FriendshipStatus.Accepted => "friends",
            FriendshipStatus.Pending when fr.RequesterId == meId => "outgoing_pending",
            FriendshipStatus.Pending => "incoming_pending",
            FriendshipStatus.Rejected => "rejected",
            _ => "none"
        };
    }

    public FriendshipDto ToFriendshipDto(FriendshipRecord fr) => new(fr.Id, fr.RequesterId, fr.AddresseeId, fr.Status.ToString().ToLowerInvariant(), fr.CreatedAt, fr.RespondedAt);

    public PostDto ToPostDto(PostRecord post)
    {
        var author = Users[post.AuthorId];
        return new PostDto(post.Id, post.AuthorId, author.FullName, author.AvatarUrl, post.Content, post.ImageUrls, post.CreatedAt);
    }
}

class SocialHub : Hub
{
}

static class PasswordHasher
{
    public static string Hash(string password)
    {
        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var hash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password + salt)));
        return $"{salt}:{hash}";
    }

    public static bool Verify(string password, string stored)
    {
        var parts = stored.Split(':');
        if (parts.Length != 2) return false;
        var computed = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password + parts[0])));
        return computed == parts[1];
    }
}
