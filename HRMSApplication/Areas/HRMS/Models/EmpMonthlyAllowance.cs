namespace HRMSApp.Areas.HRMS.Models
{
    public class EmpMonthlyAllowance
    {
        public string? allowanceType { get; set; }
        public List<amountList>? amountList { get; set; }
    }
    public class amountList
    {
        public string? empCode { get; set; }
        public int mm { get; set; }
        public int yy { get; set; }
        public decimal amount { get; set; }
    }
}
