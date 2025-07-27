namespace HRMSApp.Areas.HRMS.Models
{
    public class EmployeeSetup
    {
        public string? empCode { get; set; }
        public string? biometricID { get; set; }
        public bool isGeoFenceAllow { get; set; }
        public bool isCoffAllow { get; set; }
        public bool isOtAllow { get; set; }
        public int otRate { get; set; }
        public int minPunch { get; set; }
        public string? currentShift { get; set; }
        public bool isRotationApplicable { get; set; }
    }
}
