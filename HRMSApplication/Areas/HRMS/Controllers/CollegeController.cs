using System.Reflection.PortableExecutable;
using HRMSApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class CollegeController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public CollegeController(IHeaderService headerService)
        {
            _headers = headerService;
            
        }
        public async Task<ActionResult> GetCollegeList()
        {
            //ApiService apiConsume=new ApiService();
            string loginId = HttpContext.Session.GetString("loginId");
            string url = ApiService.LMS + $"UniversityStructure/v1/getColleges?username={loginId}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            //var result=JsonConvert.SerializeObject(response);
            return new JsonResult(response);
        }
    }
}
