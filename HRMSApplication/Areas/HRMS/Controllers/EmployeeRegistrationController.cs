using HRMSApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class EmployeeRegistrationController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public EmployeeRegistrationController(IHeaderService headerService)
        {
            _headers = headerService;
            
        }
        public IActionResult Dashboard()
        {
            return View();
        }
    }
}
