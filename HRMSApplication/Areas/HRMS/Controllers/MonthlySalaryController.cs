using Microsoft.AspNetCore.Mvc;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class MonthlySalaryController : Controller
    {
        public IActionResult monthlyAllowance()
        {
            return View();
        }
        public IActionResult monthlyDeductions()
        {
            return View();
        }

        public IActionResult prepareSalary()
        {
            return View();
        }
    }
}
