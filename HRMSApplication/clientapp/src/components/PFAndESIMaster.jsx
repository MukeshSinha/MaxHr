import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';

function PFAndESIMaster() {
    const [activeTab, setActiveTab] = useState('PF');
    const [pfFormData, setPFFormData] = useState({
        pfCode: '',
        employeeShare: '',
        employerShareMax: '',
        adminChargesDeductFrom: null,
        employerPercent: '',
        edliPercent: '',
        epsPercent: '',
        erPercent: '',
        epfPercent: '',
        wef: '',
    });
    const [esiFormData, setESIFormData] = useState({
        esiMaxAmount: '',
        employeeContributionPercent: '',
        employerContributionPercent: '',
        esiOnArrear: false,
    });
    const [pfErrors, setPFErrors] = useState({});
    const [esiErrors, setESIErrors] = useState({});

    const adminChargesOptions = [
        { value: 'employer', label: 'Employer' },
        { value: 'employee', label: 'Employee' },
    ];

    // Handle PF input change
    const handlePFInputChange = (field, value) => {
        setPFFormData({ ...pfFormData, [field]: value });
        if (pfErrors[field]) setPFErrors({ ...pfErrors, [field]: false });
    };

    // Handle ESI input change
    const handleESIInputChange = (field, value) => {
        setESIFormData({ ...esiFormData, [field]: value });
        if (esiErrors[field]) setESIErrors({ ...esiErrors, [field]: false });
    };

    // Validate PF form
    const validatePFForm = () => {
        const newErrors = {};
        if (!pfFormData.pfCode) newErrors.pfCode = true;
        if (!pfFormData.employeeShare) newErrors.employeeShare = true;
        if (!pfFormData.employerShareMax) newErrors.employerShareMax = true;
        if (!pfFormData.adminChargesDeductFrom) newErrors.adminChargesDeductFrom = true;
        if (!pfFormData.employerPercent) newErrors.employerPercent = true;
        if (!pfFormData.edliPercent) newErrors.edliPercent = true;
        if (!pfFormData.epsPercent) newErrors.epsPercent = true;
        if (!pfFormData.erPercent) newErrors.erPercent = true;
        if (!pfFormData.epfPercent) newErrors.epfPercent = true;
        if (!pfFormData.wef) newErrors.wef = true;

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill all required PF fields!', {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'pf-validation-error',
            });
            setPFErrors(newErrors);
            return false;
        }
        return true;
    };

    // Validate ESI form
    const validateESIForm = () => {
        const newErrors = {};
        if (!esiFormData.esiMaxAmount) newErrors.esiMaxAmount = true;
        if (!esiFormData.employeeContributionPercent) newErrors.employeeContributionPercent = true;
        if (!esiFormData.employerContributionPercent) newErrors.employerContributionPercent = true;

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill all required ESI fields!', {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'esi-validation-error',
            });
            setESIErrors(newErrors);
            return false;
        }
        return true;
    };

    // Handle PF form submission
    const handlePFSubmit = async (e) => {
        e.preventDefault();
        if (validatePFForm()) {
            try {
                const response = await fetch('/PFSettings/SavePF', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...pfFormData,
                        adminChargesDeductFrom: pfFormData.adminChargesDeductFrom?.value || '',
                    }),
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response.json();
                if (result.statusCode === 1) {
                    toast.success('PF settings saved successfully!', {
                        position: 'top-right',
                        autoClose: 3000,
                        toastId: 'pf-submit-success',
                    });
                    setPFFormData({
                        pfCode: '',
                        employeeShare: '',
                        employerShareMax: '',
                        adminChargesDeductFrom: null,
                        employerPercent: '',
                        edliPercent: '',
                        epsPercent: '',
                        erPercent: '',
                        epfPercent: '',
                        wef: '',
                    });
                    setPFErrors({});
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
            } catch (error) {
                toast.error(`Failed to save PF settings: ${error.message}`, {
                    position: 'top-right',
                    autoClose: 3000,
                    toastId: 'pf-submit-error',
                });
            }
        }
    };

    // Handle ESI form submission
    const handleESISubmit = async (e) => {
        e.preventDefault();
        if (validateESIForm()) {
            try {
                const response = await fetch('/ESISettings/SaveESI', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(esiFormData),
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response.json();
                if (result.statusCode === 1) {
                    toast.success('ESI settings saved successfully!', {
                        position: 'top-right',
                        autoClose: 3000,
                        toastId: 'esi-submit-success',
                    });
                    setESIFormData({
                        esiMaxAmount: '',
                        employeeContributionPercent: '',
                        employerContributionPercent: '',
                        esiOnArrear: false,
                    });
                    setESIErrors({});
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
            } catch (error) {
                toast.error(`Failed to save ESI settings: ${error.message}`, {
                    position: 'top-right',
                    autoClose: 3000,
                    toastId: 'esi-submit-error',
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6 text-center text-gray-800">PF & ESI Master</h2>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-colors duration-200 ${activeTab === 'PF'
                                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                        onClick={() => setActiveTab('PF')}
                    >
                        <div className="flex items-center justify-center">
                            🏦
                            <span className="ml-2">PF Settings</span>
                        </div>
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-colors duration-200 ${activeTab === 'ESI'
                                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                        onClick={() => setActiveTab('ESI')}
                    >
                        <div className="flex items-center justify-center">
                            🛡️
                            <span className="ml-2">ESI Settings</span>
                        </div>
                    </button>
                </div>

                {/* PF Settings Tab */}
                {activeTab === 'PF' && (
                    <form onSubmit={handlePFSubmit} className="space-y-4">
                        {/* PF Code */}
                        <div className="flex flex-col">
                            <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                PF Code
                                <span className="ml-2">💰</span>
                            </label>
                            <input
                                type="text"
                                value={pfFormData.pfCode}
                                onChange={(e) => handlePFInputChange('pfCode', e.target.value)}
                                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.pfCode ? 'border-2 border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter PF Code..."
                            />
                        </div>

                        {/* Employee Share & Employer Share Max Amount */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Employee Share
                                    <span className="ml-2">📉</span>
                                </label>
                                <input
                                    type="text"
                                    value={pfFormData.employeeShare}
                                    onChange={(e) => handlePFInputChange('employeeShare', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.employeeShare ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Employee Share..."
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Employer Share Max Amount
                                    <span className="ml-2">💸</span>
                                </label>
                                <input
                                    type="number"
                                    value={pfFormData.employerShareMax}
                                    onChange={(e) => handlePFInputChange('employerShareMax', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.employerShareMax ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Max Amount..."
                                />
                            </div>
                        </div>

                        {/* Admin Charges Deduct From & Employer Percent */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Admin Charges Deduct From
                                    <span className="ml-2">🏢</span>
                                </label>
                                <Select
                                    options={adminChargesOptions}
                                    value={pfFormData.adminChargesDeductFrom}
                                    onChange={(value) => handlePFInputChange('adminChargesDeductFrom', value)}
                                    className={`w-full text-sm ${pfErrors.adminChargesDeductFrom ? 'border-2 border-red-500' : ''
                                        }`}
                                    placeholder="Select Deduction Source..."
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Employer Percent (%)
                                    <span className="ml-2">📊</span>
                                </label>
                                <input
                                    type="text"
                                    value={pfFormData.employerPercent}
                                    onChange={(e) => handlePFInputChange('employerPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.employerPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Employer Percent..."
                                />
                            </div>
                        </div>

                        {/* EDLI % & EPS % */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    EDLI %
                                    <span className="ml-2">📈</span>
                                </label>
                                <input
                                    type="text"
                                    value={pfFormData.edliPercent}
                                    onChange={(e) => handlePFInputChange('edliPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.edliPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter EDLI %..."
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    EPS %
                                    <span className="ml-2">📈</span>
                                </label>
                                <input
                                    type="text"
                                    value={pfFormData.epsPercent}
                                    onChange={(e) => handlePFInputChange('epsPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.epsPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter EPS %..."
                                />
                            </div>
                        </div>

                        {/* ER % & EPF % */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    ER %
                                    <span className="ml-2">📈</span>
                                </label>
                                <input
                                    type="text"
                                    value={pfFormData.erPercent}
                                    onChange={(e) => handlePFInputChange('erPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.erPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter ER %..."
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    EPF %
                                    <span className="ml-2">📈</span>
                                </label>
                                <input
                                    type="text"
                                    value={pfFormData.epfPercent}
                                    onChange={(e) => handlePFInputChange('epfPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                    pfErrors.epfPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter EPF %..."
                                />
                            </div>
                        </div>

                        {/* WEF */}
                        <div className="flex flex-col">
                            <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                WEF (With Effect From)
                                <span className="ml-2">📅</span>
                            </label>
                            <input
                                type="date"
                                value={pfFormData.wef}
                                onChange={(e) => handlePFInputChange('wef', e.target.value)}
                                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${pfErrors.wef ? 'border-2 border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm"
                            >
                                Save PF
                            </button>
                        </div>
                    </form>
                )}

                {/* ESI Settings Tab */}
                {activeTab === 'ESI' && (
                    <form onSubmit={handleESISubmit} className="space-y-4">
                        {/* ESI Max Amount */}
                        <div className="flex flex-col">
                            <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                ESI Max Amount
                                <span className="ml-2">💸</span>
                            </label>
                            <input
                                type="number"
                                value={esiFormData.esiMaxAmount}
                                onChange={(e) => handleESIInputChange('esiMaxAmount', e.target.value)}
                                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${esiErrors.esiMaxAmount ? 'border-2 border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter ESI Max Amount..."
                            />
                        </div>

                        {/* Employee Contribution % & Employer Contribution % */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Employee Contribution %
                                    <span className="ml-2">📉</span>
                                </label>
                                <input
                                    type="text"
                                    value={esiFormData.employeeContributionPercent}
                                    onChange={(e) => handleESIInputChange('employeeContributionPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${esiErrors.employeeContributionPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Employee Contribution %..."
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Employer Contribution %
                                    <span className="ml-2">📉</span>
                                </label>
                                <input
                                    type="text"
                                    value={esiFormData.employerContributionPercent}
                                    onChange={(e) => handleESIInputChange('employerContributionPercent', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${esiErrors.employerContributionPercent ? 'border-2 border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Employer Contribution %..."
                                />
                            </div>
                        </div>

                        {/* ESI On Arrear Checkbox */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esiFormData.esiOnArrear}
                                onChange={(e) => handleESIInputChange('esiOnArrear', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="flex items-center text-gray-700 font-medium ml-2 text-sm">
                                ESI On Arrear
                                <span className="ml-2">✅</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm"
                            >
                                Save ESI Settings
                            </button>
                        </div>
                    </form>
                )}

                <ToastContainer />
            </div>
        </div>
    );
}

export default PFAndESIMaster;