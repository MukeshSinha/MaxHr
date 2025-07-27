import React, { useState, useContext, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import LoaderComponent from "./LoaderComponent";

function PreLoginComponent() {
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        userID: "",
        ipaddress: "",
    });
    
    const navigate = useNavigate();
    const userInputRef = useRef(null);

    // Set focus on the username input when component mounts
    useEffect(() => {
        userInputRef.current.focus();
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

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        // Validation
        if (!formData.userID.trim()) {
            newErrors.username = "Username is required";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const payload = {
            userID: formData.userID,
            IpAddress: formData.ipaddress
        };
        const startTime = Date.now();
        try {
            setIsLoading(true);

            const apiUrl = "/HRMS/Login/VerifyLogin"; // Keep relative URL
            console.log("Sending request to:", window.location.origin + apiUrl, "with payload:", payload);

            const userApiResponse = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            console.log("Response status:", userApiResponse.status, "URL:", userApiResponse.url);

            if (!userApiResponse.ok) {
                throw new Error(`HTTP error! Status: ${userApiResponse.status}`);
            }

            let result;
            try {
                result = await userApiResponse.json();
                if (typeof result === "string") {
                    result = JSON.parse(result);
                }
            } catch (error) {
                console.error("Failed to parse response:", error);
                throw new Error("Invalid response format from server");
            }

            console.log("Pre Login Response is:", result);

            if (result.DataFetch?.Table?.length > 0) {
                const { UserID, UserName, LoginID } = result.DataFetch.Table[0];;
                const statusCode = result.statusCode;
                const userName = result.DataFetch.Table[0].UserName
                toast.success(`Welcome, ${UserName || "Guest"}!`, { position: "top-center" });
                setFormData({ userID: "" });
                navigate("/Password");
            } else {
                const errorMessage = result.message || "The user does not exist";
                toast.error(`Failed to login: ${errorMessage}`, { position: "top-center" });
            }
        }
        catch (error) {
            console.error("Submission error:", error);
            toast.error("Submission failed: " + error.message, { position: "top-center" });
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
            <div className="relative z-10 bg-white bg-opacity-95 p-10 rounded-3xl shadow-2xl w-full max-w-2xl">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-700">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-md font-medium mb-2">Username</label>
                        <input
                            ref={userInputRef}
                            name="userID"
                            type="text"
                            value={formData.userID}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            className={`w-full px-4 py-3 border ${errors.username ? "border-red-500" : "border-gray-300"
                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
                        />
                        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white text-lg font-semibold py-3 rounded-xl hover:bg-blue-600 transition"
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

export default PreLoginComponent;