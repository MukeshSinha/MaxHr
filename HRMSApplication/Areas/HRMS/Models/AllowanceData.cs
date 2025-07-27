namespace HRMSApp.Areas.HRMS.Models
{
    public class AllowanceData
    {
        public string? empCode { get; set; }
        public DateTime wefDate { get; set; }
        public List<allowanceDetail>? allowanceDetail { get; set; }
    }
    public class allowanceDetail
    {
        public int HeadID { get; set; }
        public decimal Rates { get; set; }
    }

    public class AllowanceDating
    {
        public string? empCode { get; set; }
        public DateTime wefDate { get; set; }
        public decimal rateVDA { get; set; }
        public decimal rateBasic { get; set; }
    }
}
