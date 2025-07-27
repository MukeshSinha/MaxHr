namespace CampusConnect.HRMSApplication.Areas.HRMS.Models
{
    public class Allowance
    {
        public int AID { get; set; }
        public string? AllowName { get; set; }
        public int AllowType { get; set; }
        public decimal TaxPercent { get; set; }
    }
}
