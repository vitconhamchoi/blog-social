using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));

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

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/social"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch
    {
    }
}

app.MapGet("/", () => Results.Ok(new { service = "BlogSocial.Api", status = "ok", storage = "postgres-configured", auth = "jwt-phase1" }));

app.MapPost("/api/auth/register", async (RegisterRequest req, AppDbContext db, JwtTokenService jwt) =>
{
    if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.FullName))
        return Results.BadRequest(new { message = "Email, password, fullName are required." });

    var normalizedEmail = req.Email.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(u => u.Email == normalizedEmail))
        return Results.BadRequest(new { message = "Email already exists." });

    var user = new UserEntity
    {
        Id = Guid.NewGuid(),
        Email = normalizedEmail,
        FullName = req.FullName.Trim(),
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
        Bio = string.Empty,
        AvatarUrl = null,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    var token = jwt.CreateAccessToken(user);
    return Results.Ok(new AuthResponse(token, ToUserDto(user)));
});

app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, JwtTokenService jwt) =>
{
    var email = req.Email?.Trim().ToLowerInvariant() ?? string.Empty;
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Invalid credentials." });

    var token = jwt.CreateAccessToken(user);
    return Results.Ok(new AuthResponse(token, ToUserDto(user)));
});

app.MapGet("/api/auth/me", async (HttpContext http, AppDbContext db) =>
{
    var user = await RequireUserAsync(http, db);
    return user is null ? Results.Unauthorized() : Results.Ok(ToUserDto(user));
}).RequireAuthorization();

app.MapPatch("/api/users/me", async (HttpContext http, UpdateProfileRequest req, AppDbContext db) =>
{
    var user = await RequireUserAsync(http, db);
    if (user is null) return Results.Unauthorized();

    user.FullName = string.IsNullOrWhiteSpace(req.FullName) ? user.FullName : req.FullName.Trim();
    user.Bio = req.Bio?.Trim() ?? user.Bio;
    await db.SaveChangesAsync();
    return Results.Ok(ToUserDto(user));
}).RequireAuthorization();

app.MapPost("/api/users/me/avatar", async (HttpContext http, UpdateAvatarRequest req, AppDbContext db) =>
{
    var user = await RequireUserAsync(http, db);
    if (user is null) return Results.Unauthorized();
    user.AvatarUrl = req.AvatarUrl?.Trim();
    await db.SaveChangesAsync();
    return Results.Ok(ToUserDto(user));
}).RequireAuthorization();

app.MapGet("/api/users", async (HttpContext http, string? q, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();

    var query = (q ?? string.Empty).Trim().ToLowerInvariant();
    var users = await db.Users
        .Where(u => u.Id != me.Id)
        .Where(u => string.IsNullOrEmpty(query) || u.FullName.ToLower().Contains(query) || u.Email.Contains(query))
        .ToListAsync();

    var friendships = await db.Friendships.ToListAsync();
    var result = users.Select(u => new UserListItemDto(u.Id, u.Email, u.FullName, u.Bio, u.AvatarUrl, GetFriendshipStatus(friendships, me.Id, u.Id))).ToList();
    return Results.Ok(result);
}).RequireAuthorization();

app.MapGet("/api/users/{userId:guid}", async (HttpContext http, Guid userId, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();

    var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId);
    if (user is null) return Results.NotFound();

    var friendships = await db.Friendships.ToListAsync();
    var areFriends = AreFriends(friendships, me.Id, userId);

    var posts = await db.Posts.Include(x => x.Author)
        .Where(p => p.AuthorId == userId && (me.Id == userId || areFriends))
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();

    return Results.Ok(new ProfileDetailsDto(ToUserDto(user), areFriends, posts.Select(ToPostDto).ToList()));
}).RequireAuthorization();

app.MapPost("/api/friend-requests/{targetUserId:guid}", async (HttpContext http, Guid targetUserId, AppDbContext db, IHubContext<SocialHub> hub) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();
    if (!await db.Users.AnyAsync(x => x.Id == targetUserId)) return Results.NotFound();
    if (targetUserId == me.Id) return Results.BadRequest(new { message = "Cannot friend yourself." });

    var friendships = await db.Friendships.ToListAsync();
    if (AreFriends(friendships, me.Id, targetUserId)) return Results.BadRequest(new { message = "Already friends." });
    if (friendships.Any(f => f.Status == "pending" && ((f.RequesterId == me.Id && f.AddresseeId == targetUserId) || (f.RequesterId == targetUserId && f.AddresseeId == me.Id))))
        return Results.BadRequest(new { message = "Pending request already exists." });

    var fr = new FriendshipEntity
    {
        Id = Guid.NewGuid(),
        RequesterId = me.Id,
        AddresseeId = targetUserId,
        Status = "pending",
        CreatedAt = DateTimeOffset.UtcNow
    };
    db.Friendships.Add(fr);
    await db.SaveChangesAsync();

    await hub.Clients.Group($"user:{targetUserId}").SendAsync("friendRequestReceived", new { requestId = fr.Id, fromUserId = me.Id, fromName = me.FullName });
    return Results.Ok(ToFriendshipDto(fr));
}).RequireAuthorization();

app.MapPost("/api/friend-requests/{requestId:guid}/accept", async (HttpContext http, Guid requestId, AppDbContext db, IHubContext<SocialHub> hub) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();

    var fr = await db.Friendships.FirstOrDefaultAsync(x => x.Id == requestId);
    if (fr is null) return Results.NotFound();
    if (fr.AddresseeId != me.Id) return Results.Forbid();

    fr.Status = "accepted";
    fr.RespondedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    await hub.Clients.Group($"user:{fr.RequesterId}").SendAsync("friendRequestAccepted", new { requestId = fr.Id, byUserId = me.Id, byName = me.FullName });
    await hub.Clients.Group($"user:{fr.RequesterId}").SendAsync("friendsUpdated");
    await hub.Clients.Group($"user:{fr.AddresseeId}").SendAsync("friendsUpdated");

    return Results.Ok(ToFriendshipDto(fr));
}).RequireAuthorization();

app.MapPost("/api/friend-requests/{requestId:guid}/reject", async (HttpContext http, Guid requestId, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();

    var fr = await db.Friendships.FirstOrDefaultAsync(x => x.Id == requestId);
    if (fr is null) return Results.NotFound();
    if (fr.AddresseeId != me.Id) return Results.Forbid();

    fr.Status = "rejected";
    fr.RespondedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(ToFriendshipDto(fr));
}).RequireAuthorization();

app.MapGet("/api/friends", async (HttpContext http, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();

    var friendships = await db.Friendships.Where(f => f.Status == "accepted" && (f.RequesterId == me.Id || f.AddresseeId == me.Id)).ToListAsync();
    var friendIds = friendships.Select(f => f.RequesterId == me.Id ? f.AddresseeId : f.RequesterId).ToList();
    var friends = await db.Users.Where(u => friendIds.Contains(u.Id)).ToListAsync();

    return Results.Ok(friends.Select(ToUserDto).ToList());
}).RequireAuthorization();

app.MapGet("/api/friend-requests/incoming", async (HttpContext http, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();
    var items = await db.Friendships.Where(f => f.AddresseeId == me.Id && f.Status == "pending").ToListAsync();
    return Results.Ok(items.Select(ToFriendshipDto).ToList());
}).RequireAuthorization();

app.MapGet("/api/friend-requests/outgoing", async (HttpContext http, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();
    var items = await db.Friendships.Where(f => f.RequesterId == me.Id && f.Status == "pending").ToListAsync();
    return Results.Ok(items.Select(ToFriendshipDto).ToList());
}).RequireAuthorization();

app.MapPost("/api/uploads/image", async (HttpContext http) =>
{
    var form = await http.Request.ReadFormAsync();
    var file = form.Files["file"];
    if (file is null || file.Length == 0) return Results.BadRequest(new { message = "File is required." });

    var extension = Path.GetExtension(file.FileName);
    var fileName = $"{Guid.NewGuid()}{extension}";
    var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
    var filePath = Path.Combine(uploadsPath, fileName);

    await using var stream = File.Create(filePath);
    await file.CopyToAsync(stream);

    return Results.Ok(new { url = $"/uploads/{fileName}", fileName });
}).RequireAuthorization();

app.MapPost("/api/posts", async (HttpContext http, CreatePostRequest req, AppDbContext db, IHubContext<SocialHub> hub) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();
    if (string.IsNullOrWhiteSpace(req.Content)) return Results.BadRequest(new { message = "Content is required." });

    var post = new PostEntity
    {
        Id = Guid.NewGuid(),
        AuthorId = me.Id,
        Content = req.Content.Trim(),
        ImageUrlsJson = JsonSerializer.Serialize(req.ImageUrls?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToList() ?? new List<string>()),
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Posts.Add(post);
    await db.SaveChangesAsync();

    var friendIds = await db.Friendships
        .Where(f => f.Status == "accepted" && (f.RequesterId == me.Id || f.AddresseeId == me.Id))
        .Select(f => f.RequesterId == me.Id ? f.AddresseeId : f.RequesterId)
        .ToListAsync();

    foreach (var friendId in friendIds)
        await hub.Clients.Group($"user:{friendId}").SendAsync("feedUpdated", new { authorId = me.Id, authorName = me.FullName, postId = post.Id });

    post.Author = me;
    return Results.Ok(ToPostDto(post));
}).RequireAuthorization();

app.MapGet("/api/posts/feed", async (HttpContext http, AppDbContext db) =>
{
    var me = await RequireUserAsync(http, db);
    if (me is null) return Results.Unauthorized();

    var friendIds = await db.Friendships
        .Where(f => f.Status == "accepted" && (f.RequesterId == me.Id || f.AddresseeId == me.Id))
        .Select(f => f.RequesterId == me.Id ? f.AddresseeId : f.RequesterId)
        .ToListAsync();

    friendIds.Add(me.Id);

    var posts = await db.Posts.Include(p => p.Author)
        .Where(p => friendIds.Contains(p.AuthorId))
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();

    return Results.Ok(posts.Select(ToPostDto).ToList());
}).RequireAuthorization();

app.MapHub<SocialHub>("/hubs/social").RequireAuthorization();

app.Run();

static async Task<UserEntity?> RequireUserAsync(HttpContext http, AppDbContext db)
{
    var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? http.User.FindFirstValue(ClaimTypes.Name) ?? http.User.FindFirstValue("sub");
    return Guid.TryParse(userId, out var parsedUserId) ? await db.Users.FirstOrDefaultAsync(x => x.Id == parsedUserId) : null;
}

static UserDto ToUserDto(UserEntity user) => new(user.Id, user.Email, user.FullName, user.Bio, user.AvatarUrl, user.CreatedAt);
static FriendshipDto ToFriendshipDto(FriendshipEntity fr) => new(fr.Id, fr.RequesterId, fr.AddresseeId, fr.Status, fr.CreatedAt, fr.RespondedAt);
static PostDto ToPostDto(PostEntity post) => new(post.Id, post.AuthorId, post.Author?.FullName ?? "Unknown", post.Author?.AvatarUrl, post.Content, JsonSerializer.Deserialize<List<string>>(post.ImageUrlsJson) ?? new List<string>(), post.CreatedAt);

static bool AreFriends(List<FriendshipEntity> friendships, Guid a, Guid b) => friendships.Any(f => f.Status == "accepted" && ((f.RequesterId == a && f.AddresseeId == b) || (f.RequesterId == b && f.AddresseeId == a)));
static string GetFriendshipStatus(List<FriendshipEntity> friendships, Guid meId, Guid otherUserId)
{
    var fr = friendships.FirstOrDefault(f => (f.RequesterId == meId && f.AddresseeId == otherUserId) || (f.RequesterId == otherUserId && f.AddresseeId == meId));
    if (fr is null) return "none";
    return fr.Status switch
    {
        "accepted" => "friends",
        "pending" when fr.RequesterId == meId => "outgoing_pending",
        "pending" => "incoming_pending",
        "rejected" => "rejected",
        _ => "none"
    };
}

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

class SocialHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userId, out var parsedUserId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{parsedUserId}");

        await base.OnConnectedAsync();
    }
}
