namespace HRMSApp.Areas.HRMS.Models
{
    public class Holiday
    {
        public int iD { get; set; }
        public string? compCode { get; set; }
        public int ctgId { get; set; }
        public string? hdName { get; set; }
        public DateTime fromDate { get; set; }
        public DateTime uptoDate { get; set; }
    }
}
