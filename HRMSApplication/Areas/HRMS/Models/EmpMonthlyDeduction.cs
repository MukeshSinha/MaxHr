namespace HRMSApp.Areas.HRMS.Models
{
    public class EmpMonthlyDeduction
    {
        public string? deductionType { get; set; }
        public List<AmountDetail>? amountList { get; set; }
    }
    public class AmountDetail
    {
        public string? empCode { get; set; }
        public int mm { get; set; }
        public int yy { get; set; }
        public decimal amount { get; set; }
    }
}
