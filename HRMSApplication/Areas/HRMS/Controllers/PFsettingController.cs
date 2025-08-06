using Microsoft.AspNetCore.Mvc;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class PFsettingController : Controller
    {
        public IActionResult PFsetting()
        {
            return View();
        }
    }
}
