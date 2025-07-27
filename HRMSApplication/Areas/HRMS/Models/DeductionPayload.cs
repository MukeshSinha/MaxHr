namespace HRMSApp.Areas.HRMS.Models
{
    public class DeductionPayload
    {
        public string? empCode { get; set; }
        public DateTime wefdate { get; set; }
        public List<DeductionDetail>? deductionDetail { get; set; }
    }
    public class DeductionDetail
    {
        public int headID { get; set; }
        public decimal rates { get; set; }
    }
}
