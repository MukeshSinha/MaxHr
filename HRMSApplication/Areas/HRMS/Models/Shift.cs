namespace HRMSApp.Areas.HRMS.Models
{
    public class Shift
    {
        public int sid { get; set; }
        public string? sftCode { get; set; }
        public string? in_Time { get; set; }
        public string? out_Time { get; set; }
        public string? workHrs { get; set; }
        public int graceInMins { get; set; }
        public int minWrkHrsforHalfDay { get; set; }
        public int minWrkHrsforFullDay { get; set; }
        public int absDayWrkHrsLessThan { get; set; }
        public bool isNight { get; set; }
    }
}
