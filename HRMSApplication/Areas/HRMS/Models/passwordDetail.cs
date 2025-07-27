namespace HRMSApplication.Areas.HRMS.Models
{
    public class passwordDetail
    {
        public string? username { get; set; }
        public string? password { get; set; }
        public string? ipaddress { get; set; }
        public string? DeviceToken { get; set; }
        public string? DeviceID { get; set; } = "";
    }
}
