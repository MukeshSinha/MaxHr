using Microsoft.AspNetCore.Mvc;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class TimeOfficeController : Controller
    {
        public IActionResult TimeOfficeSetup()
        {
            return View();
        }

        public IActionResult AttendanceProcess()
        {
            return View();
        }

        public IActionResult LeaveRequest()
        {
            return View();
        }
    }
}
