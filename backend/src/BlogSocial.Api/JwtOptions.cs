public class JwtOptions
{
    public string Issuer { get; set; } = "BlogSocial";
    public string Audience { get; set; } = "BlogSocial.Web";
    public string Key { get; set; } = string.Empty;
}
