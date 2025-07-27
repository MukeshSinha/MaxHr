using System.Security.Cryptography;
using System.Text;
using HRMSApplication.Areas.HRMS.Models;
using Newtonsoft.Json;

namespace HRMSApplication.BusinessLayer
{
    public class UserAuthentication
    {
        private readonly SessionManager _sessionManager;
        public UserAuthentication(SessionManager sess)
        {
            _sessionManager = sess;
        }

        public int VerifyLogin(userDetails usrdetail)
        {
            string univNm = "";
            int i = 0;
            if (usrdetail == null) { return i; }
            else
            {
                ApiService apiService = new ApiService();
                string url = "https://www.universitymanagementsystem.in/webapi/api/Registration/PreLogin";
                string res = JsonConvert.SerializeObject(usrdetail);
                var responseGet = apiService.SendRequestAsync(url, HttpMethod.Post, null, null, res);
                dynamic userInfo = JsonConvert.DeserializeObject(responseGet.Result);
                foreach (var uinfo in userInfo)
                {
                    univNm = uinfo.Univ_Code;
                    _sessionManager.SetSessionVariable("univCode", univNm);
                }
                return i;
            }
        }

        public string VerifyPassword(passwordDetail pwd)
        {
            if (pwd == null) { return ""; }
            else
            {
                ApiService apiService = new ApiService();
                string url = "https://www.universitymanagementsystem.in/webapi/api/Registration/login";
                string res = Newtonsoft.Json.JsonConvert.SerializeObject(pwd);
                var responseGet = apiService.SendRequestAsync(url, HttpMethod.Post, null, null, res);
                dynamic userInfo = JsonConvert.DeserializeObject(responseGet.Result);
                string username = "";
                string RoleID = "";
                string userID = "";
                foreach (var uinfo in userInfo)
                {
                    username = uinfo.USERNAME;
                    RoleID = uinfo.RoleID;
                    userID = uinfo.USERID;
                    _sessionManager.SetSessionVariable("UserName", username);
                    _sessionManager.SetSessionVariable("UserRole", RoleID);
                    _sessionManager.SetSessionVariable("UserID", userID);
                }

                return "1";
            }
        }
    }

    public static class AesEncryption
    {
        private static readonly string key = "IL0VEMYINDIARssRS0FTW@RESPVT|_TD";
        private static readonly string iv = "THIS_IS_16_SALTS";

        public static string Encrypt(string TextToEncrypt)
        {
            using Aes aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = Encoding.UTF8.GetBytes(iv);
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            byte[] inputBytes = Encoding.UTF8.GetBytes(TextToEncrypt);
            byte[] encrypted = encryptor.TransformFinalBlock(inputBytes, 0, inputBytes.Length);

            return Convert.ToBase64String(encrypted);
        }
        public static string Decrypt(string encryptedText)
        {
            using Aes aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = Encoding.UTF8.GetBytes(iv);
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            byte[] encryptedBytes = Convert.FromBase64String(encryptedText);
            byte[] decrypted = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);

            return Encoding.UTF8.GetString(decrypted);
        }
    }
}
