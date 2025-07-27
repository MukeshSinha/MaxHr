namespace HRMSApp.Areas.HRMS.Models
{
    public class Leave
    {
        public int lvId { get; set; }
        public string? leaveCode { get; set; }
        public string? lvFull { get; set; }
        public bool isIncremental { get; set; }
        public bool isCarryForward { get; set; }
        public bool isEncashment { get; set; }
    }
}
