using HRMSApplication.Areas.HRMS.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using HRMSApplication.BusinessLayer;
using HRMSApplication.Authentication;

namespace HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class LoginController : Controller
    {
        List<dynamic> imagesList = new List<dynamic>();
        ApiService apiService = new ApiService();
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<ActionResult> VerifyLogin([FromBody] userDetails usrdetail)
        {
            string univNm = "";
            string DbNm = "";
            if (usrdetail == null) { return BadRequest(); }
            else
            {
                ApiService apiService = new ApiService();
                Dictionary<string, string> header = new Dictionary<string, string>();
                // Get database name from session//
                header.Add("portaltype", "univ");
                header.Add("IpAddress", usrdetail.IpAddress);
                string url = ApiService.userManage + "PreLogin";
                string res = JsonConvert.SerializeObject(usrdetail);
                var responseGet = await apiService.SendRequestAsync(url, HttpMethod.Post, header, null, res);
                JObject jsonResponse = JObject.Parse(responseGet);

                var table = jsonResponse["DataFetch"]?["Table"] as JArray;
                var table1 = jsonResponse["DataFetch"]?["Table1"] as JArray;
                var table2 = jsonResponse["DataFetch"]?["Table2"] as JArray;
                try
                {
                    if (table != null && table.Count > 0)
                    {
                        string userName = table[0]["UserName"]?.ToString();
                        univNm = table[0]["Univ_code"]?.ToString();
                        DbNm = table[0]["DatabaseName"]?.ToString();
                        string loginId = table[0]["LoginID"]?.ToString();
                        string userId = table[0]["UserID"]?.ToString();
                        string emailId = table[0]["Email"]?.ToString();
                        string mobileNo = table[0]["Mob"]?.ToString();

                        HttpContext.Session.SetString("univCode", univNm ??= "");
                        HttpContext.Session.SetString("DbName", DbNm ??= "");
                        HttpContext.Session.SetString("uName", userName ??= "");
                        HttpContext.Session.SetString("loginId", loginId ??= "");
                        HttpContext.Session.SetString("UserId", userId ??= "");
                        HttpContext.Session.SetString("EmailId", emailId ??= "");
                        HttpContext.Session.SetString("MobileNo", mobileNo ??= "");
                        HttpContext.Session.SetString("IpAddress", usrdetail.IpAddress);
                    }
                }
                catch (Exception ex) { Console.WriteLine(ex.Message); }

                if (table1 != null && table1.Count > 0)
                {
                    try
                    {
                        var firstRow = table1[0];
                        string UnivFullName = firstRow["Univ_name"]?.ToString();
                        string logoimg = firstRow["Univ_Logo"]?.ToString();


                        //HttpContext.Session.SetString("univFullName", UnivFullName);
                        if (!string.IsNullOrEmpty(logoimg))
                        {
                            // Dynamically determine the MIME type if possible
                            string mimeType = "image/png"; // Default
                            if (logoimg.StartsWith("/9j/")) mimeType = "image/jpeg"; // Base64 signature for JPEG
                            else if (logoimg.StartsWith("iVBOR")) mimeType = "image/png";
                            logoimg = logoimg.Replace("\r\n", "").Replace("\n", "").Replace(" ", "");
                            // Add image data to the list as dynamic object
                            imagesList.Add(new
                            {
                                MimeType = mimeType,
                                Base64Image = logoimg,

                            });
                            var imagesLists = new List<object>
              {
                new
                {
                  MimeType = mimeType,
                  Base64Image = logoimg,
                }
              };
                            var jsonData = JsonConvert.SerializeObject(imagesList);
                            HttpContext.Session.SetString("ImagesList", jsonData);
                            HttpContext.Session.SetString("UniversityName", UnivFullName);

                        }
                    }
                    catch (Exception ex) { Console.WriteLine(ex.Message); }
                }
                if (table2 != null && table2.Count > 0)
                {
                    var Row = table2[0];
                    string RoleId = Row["RoleID"]?.ToString();
                    HttpContext.Session.SetString("RoleId", RoleId);
                }
               
                ViewBag.LogoImages = imagesList;
               
                return new JsonResult(responseGet);
            }
        }

        // Password
        [HttpPost]
        public async Task<ActionResult> VerifyPassword([FromBody] passwordDetail passwordDetail)
        {
            string decryptedPassword = null;
            try
            {
                decryptedPassword = AesEncryption.Decrypt(passwordDetail.password);
            }
            catch (Exception ex)
            {
                return BadRequest($"Invalid encrypted password: {ex.Message}");
            }
            ApiService apiService = new ApiService();
            Dictionary<string, string> header = new Dictionary<string, string>();
            string userName = HttpContext.Session.GetString("uName");
            string DbNm = HttpContext.Session.GetString("DbName");
            string loginId = HttpContext.Session.GetString("loginId");
            string university_Code = HttpContext.Session.GetString("univCode");
            string dbName = HttpContext.Session.GetString("DbName") ?? "defaultDbName";
            ViewData["DbName"] = dbName;

            var obj = new passwordDetail
            {
                username = loginId,
                password = passwordDetail.password,
                ipaddress = passwordDetail.ipaddress
            };
            string univNm = "";
            try
            {
                if (obj == null)
                {
                    return BadRequest();
                }
                else
                {

                    // Get database name from session
                    header.Add("Databasename", DbNm);
                    header.Add("UserID", loginId);
                    header.Add("portaltype", "aa");
                   
                    string url = ApiService.userManage + "VerifyCredential";
                    string res = JsonConvert.SerializeObject(obj);
                    var responseGet = apiService.SendRequestAsync(url, HttpMethod.Post, header, null, res);
                    if (responseGet != null && responseGet.Result != null)
                    {
                        try
                        {
                            dynamic userInfo = JsonConvert.DeserializeObject(responseGet.Result);

                            if (userInfo is JArray)
                            {
                                var firstItem = userInfo[0];


                                if (firstItem.Result != null && firstItem.Result == "Invalid User")
                                {
                                    return new JsonResult(new { statusCode = 3 }); ;
                                }
                            }
                            else if (userInfo is JObject)
                            {

                                if (userInfo.Result != null && userInfo.Result == "Invalid User")
                                {
                                    return new JsonResult(new { statusCode = 3 }); ;
                                }
                            }

                            // If it's neither an array nor an object, handle the valid user info case
                            string username = "";
                            string RoleID = "";
                            string userID = "";
                            string password = "";
                            string EmpCode = "";
                            if (userInfo.DataFetch.Table == null)
                            {
                                return new JsonResult(new { statusCode = 3 });

                            }

                            //if (!string.IsNullOrEmpty(loginId))
                            //{
                            //    string collegeUrl = ApiService.LMS + $"UniversityStructure/v1/getColleges?username={loginId}";
                            //    var response = await apiService.SendRequestAsync(collegeUrl, HttpMethod.Get, header);

                            //    // Parse response
                            //    JObject jsonResponse = JObject.Parse(response);

                            //    // Check if dataFetch exists and is not null
                            //    var dataFetch = jsonResponse["dataFetch"];
                            //    if (dataFetch == null || dataFetch.Type == JTokenType.Null || dataFetch["table"] == null)
                            //    {
                            //        return Json(new { statusCode = 0 });
                            //    }

                            //    // Extract table safely
                            //    var table = dataFetch["table"] as JArray;
                            //    if (table == null || !table.Any())
                            //    {
                            //        return Json(new { statusCode = 0 });
                            //    }

                            //    // Extract college name safely
                            //    var college = table[0]?["college_NAME"]?.ToString();
                            //    if (string.IsNullOrEmpty(college))
                            //    {
                            //        return Json(new { statusCode = 0 });
                            //    }

                            //    // Continue processing as needed...
                            //}

                            foreach (var uinfo in userInfo.DataFetch.Table)
                            {
                                username = uinfo.UserName;
                                RoleID = uinfo.UserRole;
                                userID = uinfo.Userid;
                                password = uinfo.Password;
                                if (uinfo.EmpCode != null)
                                {
                                    EmpCode = uinfo.EmpCode;

                                }
                                else
                                {
                                    EmpCode = null;
                                }
                                HttpContext.Session.SetString("UserName", username);
                                HttpContext.Session.SetString("UserRole", RoleID);
                                HttpContext.Session.SetString("UserID", userID);
                                HttpContext.Session.SetString("Password", password);
                                HttpContext.Session.SetString("DbName", DbNm);
                                HttpContext.Session.SetString("loginId", loginId);
                                HttpContext.Session.SetString("IsAuthenticated", "true");
                                HttpContext.Session.SetString("EmpCode", EmpCode ?? string.Empty);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Handle any JSON deserialization errors
                            return BadRequest($"Error processing response: {ex.Message}");
                        }

                    }

                    else
                    {
                        // No valid response from the API
                        return StatusCode(500, "No response from the API");
                    }

                    return new JsonResult(responseGet.Result);

                }
            }
            catch (Exception ex) { Console.WriteLine(ex.Message); }
            return StatusCode(500, "No response from the API");
        }

        [HttpPost]
        public IActionResult EncryptPassword([FromBody] string password)
        {
            try
            {
                string encryptedPassword = AesEncryption.Encrypt(password);
                return Json(new { encryptedPassword });
            }
            catch (Exception ex)
            {
                return BadRequest($"Encryption error: {ex.Message}");
            }
        }
    }
}
