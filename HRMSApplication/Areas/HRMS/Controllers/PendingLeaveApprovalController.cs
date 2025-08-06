using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class PendingLeaveApprovalController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public PendingLeaveApprovalController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult Index()
        {
            return View();
        }

        // get Pending Leaves
        public async Task<ActionResult> getPendingLeaves(string? empCode = null)
        {
            string url = ApiService.HRMS + "EmpTimeOfficeSetup/getPendingLeavesForApproval";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
