namespace HRMSApplication
{
    public class ApiService
    {
        private static readonly HttpClient client = new HttpClient();
        public static string userManage = "https://www.hrcpayroll.com/UserManage/";
        public static string Host = "https://www.hrcpayroll.com/ui/api/";
        public static string InventoryHost = "https://www.universitymanagementsystem.in/inventory/api/";
        public static string HostelHost = "https://www.universitymanagementsystem.in/hostel/api/";
        public static string SearchStudent = "https://www.universitymanagementsystem.in/webapi/api/";
        public static string role = "https://www.universitymanagementsystem.in/UserManage/";
        public static string Library = "https://www.universitymanagementsystem.in/library/api/libmasters/v1";
        public static string Librarys = "https://www.universitymanagementsystem.in/library/api/Book/v1/";
        public static string bookIssue = "https://www.universitymanagementsystem.in/library/api/BookIssue/v1/";
        public static string masterLibrary = "https://www.universitymanagementsystem.in/library/api/";
        public static string HRMS = "https://www.universitymanagementsystem.in/hrms/api/";
        public static string LMS = "https://www.universitymanagementsystem.in/Lms/api/";
        public static string Student = "https://www.universitymanagementsystem.in/Student/api/";
        public static string Accounts = "https://www.universitymanagementsystem.in/Accounts/api/";
        public static string Academic = "https://www.universitymanagementsystem.in/Academic/api/";
        public static string userMenu = "https://www.universitymanagementsystem.in/uiapi/api/";
        public async Task<string> SendRequestAsync(
            string url,
            HttpMethod method,
            Dictionary<string, string> headers = null,
            Dictionary<string, string> parameters = null,
            string content = null,
            MultipartFormDataContent multipartContent = null
            )
        {
            try
            {

                HttpRequestMessage requestMessage = new HttpRequestMessage(method, url);


                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        requestMessage.Headers.Add(header.Key, header.Value);
                    }
                }
                if (parameters != null && (method == HttpMethod.Get || method == HttpMethod.Delete))
                {
                    var query = new FormUrlEncodedContent(parameters).ReadAsStringAsync().Result;
                    requestMessage.RequestUri = new Uri($"{url}?{query}");
                }

                else if (parameters != null && (method == HttpMethod.Post || method == HttpMethod.Put))
                {
                    requestMessage.Content = new FormUrlEncodedContent(parameters);
                }
                else if (content != null)
                {
                    requestMessage.Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json");
                }

                HttpResponseMessage response = await client.SendAsync(requestMessage);
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsStringAsync();
            }
            catch (HttpRequestException e)
            {
                return $"Error: {e.Message}";
            }
        }
    }
}
