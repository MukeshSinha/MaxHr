import React from 'react';
import { useNavigate } from "react-router-dom";

const DashboardComponent = () => {
    const navigate = useNavigate();

    const handleRegisterClick = async () => {
        try {
            // Call the MVC controller action
            const response = await fetch('/Registration/StudentRegistration/StudentRegistrationData', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log("Controller hit successfully");

                // After hitting controller, go to React route
                navigate('/Registration/StudentRegistration/StudentRegistrationData');
            } else {
                console.error("Failed to hit controller");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="relative w-full h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('dist/icons/HRMSBackground.jpg')" }}>
            <div className="absolute inset-0 bg-black bg-opacity-60" />
            <div className="relative z-10 text-center px-4">
                <h1 className="text-white text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">Welcome to Compliance House</h1>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate("/Login")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg shadow-lg transition duration-300"
                    >
                        Login
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

export default DashboardComponent;
