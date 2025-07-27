namespace HRMSApplication.BusinessLayer
{
    public class SessionManager
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public SessionManager(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }
        public void SetSessionVariable(string key, string value)
        {
            _httpContextAccessor.HttpContext.Session.SetString(key, value);
        }

        public string GetSessionVariable(string key)
        {
            return _httpContextAccessor.HttpContext.Session.GetString(key);
        }

        public void RemoveSessionVariable(string key)
        {
            _httpContextAccessor.HttpContext.Session.Remove(key);
        }
    }
}
