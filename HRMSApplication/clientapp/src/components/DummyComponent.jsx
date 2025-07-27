
import React from 'react';
import {useNavigate } from 'react-router-dom';

const DummyComponent = () => {
    const navigate = useNavigate();
    const handelClick = () => {
        navigate("/HRMS/Employees/EmployeeMaster");
    }
    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dummy Component</h2>
            <p className="text-gray-600">This is a dummy component created for testing purposes.</p>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handelClick}>
                Click Me
            </button>
        </div>
    );
};

export default DummyComponent;