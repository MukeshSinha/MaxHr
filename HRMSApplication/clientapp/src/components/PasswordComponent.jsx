import React, { useState, useEffect, useContext, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import LoaderComponent from "./LoaderComponent";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function PasswordComponent() {
    const [errors, setErrors] = useState({}); // Renamed setError to setErrors for consistency
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        userName: "",
        password: "",
        ipaddress: "",
        deviceToken: "",
        deviceID: "",
        deviceType: "",
    });
    //const { formData: contextData } = useContext(FormContext); // Removed unused setContextFormData
    const navigate = useNavigate();
    const passwordInputRef = useRef(null);

    // Custom function to detect device type
    const getDeviceType = () => {
        const ua = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|windows phone/.test(ua)) {
            return "mobile";
        } else if (/ipad|tablet|kindle|playbook|surface|nexus(?=.*tablet)|android(?!.*mobile)/.test(ua)) {
            return "tablet";
        } else if (/macintosh|windows|linux/.test(ua) && !/mobile|tablet/.test(ua)) {
            return "desktop";
        }
        return "unknown";
    };

    // Detect device type, IP address, and set focus on component mount
    useEffect(() => {
        passwordInputRef.current.focus();

        const deviceType = getDeviceType();

        const fetchIP = async () => {
            try {
                const response = await fetch("https://api.ipify.org?format=json");
                const data = await response.json();
                setFormData((prev) => ({
                    ...prev,
                    ipaddress: data.ip,
                    deviceType,
                }));
            } catch (error) {
                console.error("Error fetching IP address:", error);
                toast.error("Failed to fetch IP address.");
            }
        };

        fetchIP();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // Form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const startTime = Date.now();
        try {
            setIsLoading(true);

            // First API call to encrypt password
            const encryptPayload = {
                password: formData.password
            };

            const encryptResponse = await fetch("/HRMS/Login/EncryptPassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData.password),
            });

            let encryptResult = await encryptResponse.json();
            if (typeof encryptResult === "string") {
                encryptResult = JSON.parse(encryptResult);
            }
            console.log("Encrypt API Result:", encryptResult);

            if (!encryptResponse.ok) {
                toast.error(encryptResult.message || "Password encryption failed", { position: "top-center" });
                return;
            }

            // Update formData with encrypted password
            const encryptedPassword = encryptResult.encryptedPassword; // Assuming API returns encryptedPassword
            setFormData(prev => ({
                ...prev,
                password: encryptedPassword
            }));

            // Prepare payload for VerifyPassword API with encrypted password
            const verifyPayload = {
                userName: formData.userName || "",
                password: encryptedPassword,
                ipAddress: formData.ipaddress,
                deviceToken: formData.deviceToken || "",
                deviceID: formData.deviceID || "",
                deviceType: formData.deviceType,
            };
            console.log("Data sent to Verify API:", verifyPayload);

            // Second API call to verify password
            const verifyCredentialResponse = await fetch("/HRMS/Login/VerifyPassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(verifyPayload),
            });

            let verifyResult = await verifyCredentialResponse.json();
            if (typeof verifyResult === "string") {
                verifyResult = JSON.parse(verifyResult);
            }
            console.log("Verify Password API Result:", verifyResult);

            if (verifyCredentialResponse.ok) {
                if (verifyResult.statusCode === 3) {
                    toast.error("Invalid Password!", { position: "top-center" });
                }
                else if (verifyResult.statusCode === 0) {
                    toast.error("No College Assign To This LoginId Cannot Proceed Further!!", { position: "top-center" });
                }
                else {
                    toast.success("Password Verified Successfully!", { position: "top-center" });
                    setFormData({
                        userName: "",
                        password: "",
                        ipaddress: formData.ipaddress,
                        deviceType: formData.deviceType,
                        deviceToken: "",
                        deviceID: "",
                    });
                    navigate("/modules");
                }
            } else {
                toast.error(verifyResult.message || "Incorrect Password", { position: "top-center" });
            }
        } catch (error) {
            toast.error(`Submission failed: ${error.message}`, { position: "top-center" });
        } finally {
            const elapsedTime = Date.now() - startTime;
            const minimumLoaderTime = 3000;
            if (elapsedTime < minimumLoaderTime) {
                await new Promise((resolve) => setTimeout(resolve, minimumLoaderTime - elapsedTime));
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 bg-blue-100 overflow-hidden">
            <img
                src="dist/icons/Backgound.gif"
                alt="Animated school kids"
                className="absolute inset-0 w-full h-full object-contain z-0 opacity-60 scale-90"
            />
            <div className="relative z-10 bg-white bg-opacity-95 p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md sm:max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-700">Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6 relative">
                        <label className="block text-gray-700 text-sm sm:text-md font-medium mb-2">Password</label>
                        <div className="relative">
                            <input
                                ref={passwordInputRef}
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className={`w-full px-4 py-3 pr-12 border ${errors.password ? "border-red-500" : "border-gray-300"
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm sm:text-base`}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    < принадлежит EyeSlashIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.password}</p>}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white text-base sm:text-lg font-semibold py-2 sm:py-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Submit
                    </button>
                </form>
            </div>
            {isLoading && <LoaderComponent />}
            <ToastContainer position="top-center" autoClose={3000} />
        </div>
    );
}

export default PasswordComponent;