namespace HRMSApplication.Services
{
    public interface IHeaderService
    {
        Dictionary<string, string> GetHeaders();
    }
    public class HeaderServices : IHeaderService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public HeaderServices(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        }
        public Dictionary<string, string> GetHeaders()
        {
            var mheader = new Dictionary<string, string>
      {
            { "DatabaseName", _httpContextAccessor.HttpContext.Session.GetString("DbName") },
            { "UserID", "abc" },
            { "IpAddress","123.456.789" },

      };

            return mheader;
        }
    }
}
