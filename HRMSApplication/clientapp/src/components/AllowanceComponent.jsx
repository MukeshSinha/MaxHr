import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaFileCsv, FaFilePdf, FaTrash, FaExclamationTriangle, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AllowanceComponent = () => {
    const [empCode, setEmpCode] = useState('');
    const [basic, setBasic] = useState('');
    const [vda, setVda] = useState('');
    const [wefDate, setWefDate] = useState('');
    const [minWefDate, setMinWefDate] = useState('');
    const [isWefDateEnabled, setIsWefDateEnabled] = useState(false); // New state for enabling WEF Date
    const [allowances, setAllowances] = useState([]);
    const [filteredAllowances, setFilteredAllowances] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [allowanceToDelete, setAllowanceToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isTableDataLoaded, setIsTableDataLoaded] = useState(false);
    const payTypeMap = { '1': 'Fixed', '2': 'As Per Day', '3': 'Variable Pay' };

    const fetchAllowances = async () => {
        try {
            const response = await fetch('/HRMS/AllowanceMaster/AllowanceMasterList');
            if (!response.ok) throw new Error('Failed to fetch allowances');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                allowType: payTypeMap[item.allowType.toString()] || item.allowType,
                allowanceName: item.allowanceName,
                value: ''
            }));
            setAllowances(data);
            setIsDataLoaded(true);
        } catch (error) {
            toast.error(`Error fetching allowances: ${error.message}`);
            setAllowances([]);
            setIsDataLoaded(false);
        }
    };

    const fetchTableAllowances = async () => {
        try {
            const response = await fetch('/HRMS/AllowanceMaster/AllowanceTableList');
            if (!response.ok) throw new Error('Failed to fetch table allowances');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                allowType: payTypeMap[item.allowType.toString()] || item.allowType,
                allowanceName: item.allowanceName,
                value: item.value || ''
            }));
            setFilteredAllowances(data);
            setIsTableDataLoaded(true);
        } catch (error) {
            toast.error(`Error fetching table allowances: ${error.message}`);
            setFilteredAllowances([]);
            setIsTableDataLoaded(false);
        }
    };

    const fetchEmployeeDetails = async (code) => {
        if (!code) {
            setMinWefDate('');
            setIsWefDateEnabled(false);
            return;
        }
        try {
            const response = await fetch(`/HRMS/Employees/SearchEmployeeByCode?empCode=${code}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch employee details');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const employeeData = result.dataFetch.table[0];
            if (employeeData && employeeData.doj) {
                const doj = new Date(employeeData.doj);
                // Set minWefDate to the day after DOJ
                const minDate = new Date(doj);
                minDate.setDate(doj.getDate() + 1);
                setMinWefDate(minDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
                setIsWefDateEnabled(true);
            } else {
                toast.error('No DOJ found for the employee');
                setMinWefDate('');
                setIsWefDateEnabled(false);
            }
        } catch (error) {
            toast.error(`Error fetching employee details: ${error.message}`);
            setMinWefDate('');
            setIsWefDateEnabled(false);
        }
    };

    useEffect(() => {
        const calculateTotal = () => {
            const totalValue = allowances.reduce((sum, allowance) => sum + (parseFloat(allowance.value) || 0), 0) + (parseFloat(basic) || 0) + (parseFloat(vda) || 0);
            setTotal(totalValue);
        };
        calculateTotal();
    }, [basic, vda, allowances]);

    useEffect(() => {
        fetchTableAllowances();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchEmployeeDetails(empCode);
        }, 500); // Debounce to avoid rapid API calls
        return () => clearTimeout(debounce);
    }, [empCode]);

    const validateNumericInput = (value) => {
        if (value && !isNaN(value)) {
            const parts = value.split('.');
            if (parts.length > 1) {
                parts[1] = parts[1].slice(0, 2);
                return parts.join('.');
            }
            return value;
        } else if (value === '') {
            return '';
        }
        return '';
    };

    const handleAllowanceChange = (index, value) => {
        const cleanedValue = validateNumericInput(value);
        const updatedAllowances = [...allowances];
        updatedAllowances[index].value = cleanedValue;
        setAllowances(updatedAllowances);
    };

    const handleBasicChange = (e) => {
        const cleanedValue = validateNumericInput(e.target.value);
        setBasic(cleanedValue);
    };

    const handleVdaChange = (e) => {
        const cleanedValue = validateNumericInput(e.target.value);
        setVda(cleanedValue);
    };

    const handleWefDateChange = (e) => {
        setWefDate(e.target.value);
    };

    const handleDeleteClick = (allowanceId) => {
        setAllowanceToDelete(allowanceId);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!allowanceToDelete) return;
        try {
            const response = await fetch(`/HRMS/Allowance/deleteAllowance?allowanceId=${allowanceToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete allowance');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Allowance deleted successfully!', { position: 'top-center', autoClose: 3000, toastId: 'delete-success' });
                const updatedAllowances = allowances.filter(a => a.aid !== allowanceToDelete);
                setAllowances(updatedAllowances);
                const updatedTableAllowances = filteredAllowances.filter(a => a.aid !== allowanceToDelete);
                setFilteredAllowances(updatedTableAllowances);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, { position: 'top-center', autoClose: 3000, toastId: 'delete-error' });
        } finally {
            setShowConfirmDialog(false);
            setAllowanceToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setAllowanceToDelete(null);
    };

    const handleSubmit = async () => {
        if (!empCode || !wefDate) {
            toast.error('Please fill in Emp Code and WEF Date', { position: 'top-center', autoClose: 3000 });
            return;
        }

        if (minWefDate && new Date(wefDate) < new Date(minWefDate)) {
            toast.error('WEF Date cannot be earlier than or equal to Date of Joining', { position: 'top-center', autoClose: 3000 });
            return;
        }

        // AllowanceData payload
        const allowanceDataPayload = {
            empCode,
            wefDate: new Date(wefDate).toISOString(),
            allowanceDetail: allowances.map(({ aid, value }) => ({
                HeadID: aid,
                Rates: parseFloat(value) || 0
            }))
        };

        // AllowanceDating payload
        const allowanceDatingPayload = {
            empCode,
            wefDate: new Date(wefDate).toISOString(),
            rateVDA: parseFloat(vda) || 0,
            rateBasic: parseFloat(basic) || 0
        };

        try {
            // Call AllowanceData API
            const allowanceResponse = await fetch('/HRMS/Allowance/SaveAllowance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allowanceDataPayload)
            });
            if (!allowanceResponse.ok) throw new Error('Failed to save allowances');
            let allowanceResult = await allowanceResponse.json();
            if (typeof allowanceResult === "string") allowanceResult = JSON.parse(allowanceResult);
            if (allowanceResult.statusCode === 1) {
                toast.success('Allowances saved successfully!', { position: 'top-center', autoClose: 3000 });
            } else {
                toast.error('Allowances not saved!', { position: 'top-center', autoClose: 3000 });
            }

            // Call AllowanceDating API
            const basicResponse = await fetch('/HRMS/Allowance/SaveBasicData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allowanceDatingPayload)
            });
            if (!basicResponse.ok) throw new Error('Failed to save basic and VDA');
            let basicResult = await basicResponse.json();
            if (typeof basicResult === "string") basicResult = JSON.parse(basicResult);
            if (basicResult.statusCode === 1) {
                toast.success('Basic and VDA saved successfully!');
                // Clear fields after successful Basic and VDA save
                setEmpCode('');
                setWefDate('');
                setBasic('');
                setVda('');
                setAllowances(allowances.map(allowance => ({ ...allowance, value: '' })));
                setMinWefDate('');
                setIsWefDateEnabled(false);
            } else {
                throw new Error(basicResult.message || 'Basic and VDA not saved');
            }

        } catch (error) {
            toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const exportToCSV = () => {
        const exportData = filteredAllowances.map(item => ({ ID: item.aid, 'Allowance Name': item.allowanceName, 'Pay Type': item.allowType, 'Value': item.value || 0 }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'allowances.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Allowance Name', 'Pay Type', 'Value']],
                body: filteredAllowances.map(item => [item.aid, item.allowanceName, item.allowType, item.value || 0]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Allowance Management Details', 14, 10);
                },
            });
            doc.save('allowances.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'Allowance Name', selector: row => row.allowanceName, sortable: true },
        { name: 'Pay Type', selector: row => row.allowType, sortable: true },
        { name: 'Value', selector: row => row.value || '0', sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <button onClick={() => handleDeleteClick(row.aid)} className="text-red-500 hover:text-red-700" title="Delete">
                    <FaTrash className="w-4 h-4" />
                </button>
            )
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '12px',
            },
        },
        cells: {
            style: {
                padding: '12px',
                fontSize: '14px',
            },
        },
        rows: {
            style: {
                minHeight: '56px',
            },
        },
    };

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Input Fields */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Allowance
                    </h2>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Emp Code</label>
                            <div className="mt-1 relative">
                                <input
                                    type="text"
                                    value={empCode}
                                    onChange={(e) => setEmpCode(e.target.value)}
                                    placeholder="Enter Emp Code"
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">WEF Date</label>
                            <input
                                type="date"
                                value={wefDate}
                                onChange={handleWefDateChange}
                                min={minWefDate}
                                disabled={!isWefDateEnabled}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Basic</label>
                            <input
                                type="text"
                                value={basic}
                                onChange={handleBasicChange}
                                placeholder="Enter Basic"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">VDA</label>
                            <input
                                type="text"
                                value={vda}
                                onChange={handleVdaChange}
                                placeholder="Enter VDA"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center gap-4">
                                <div
                                    className="flex-grow bg-red-600 border border-red-600 rounded-md text-white px-4 py-2 text-sm font-medium cursor-pointer"
                                    onClick={() => {
                                        if (!isDataLoaded) fetchAllowances();
                                        setIsAccordionOpen(!isAccordionOpen);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Allowance</span>
                                        {isAccordionOpen ? <FaAngleUp className="w-4 h-4" /> : <FaAngleDown className="w-4 h-4" />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Total:</span>
                                    <input
                                        type="number"
                                        value={total}
                                        disabled
                                        className="w-24 border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-sm text-right text-black"
                                    />
                                </div>
                            </div>
                            {isAccordionOpen && allowances.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {allowances.map((allowance, index) => (
                                        <div key={index} className="border p-2 rounded-md bg-gray-50">
                                            <label className="flex items-center gap-2 text-sm">
                                                <span>{allowance.allowanceName}</span>
                                                <input
                                                    type="text"
                                                    value={allowance.value}
                                                    onChange={(e) => handleAllowanceChange(index, e.target.value)}
                                                    placeholder={`Enter ${allowance.allowanceName}`}
                                                    className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    data-aid={allowance.aid}
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side - DataTable */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                        Allowance List
                    </h3>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            placeholder="Search allowances..."
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                        />
                        <div className="relative w-full sm:w-auto">
                            <button
                                type="button"
                                className="w-full sm:w-auto px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                Export
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    <button
                                        type="button"
                                        onClick={exportToCSV}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <FaFileCsv className="w-4 h-4 mr-2" /> Export to CSV
                                    </button>
                                    <button
                                        type="button"
                                        onClick={exportToPDF}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <FaFilePdf className="w-4 h-4 mr-2" /> Export to PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columns}
                            data={filteredAllowances.filter(item =>
                                item.allowanceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.allowType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.value || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            pagination
                            paginationPerPage={5}
                            paginationRowsPerPageOptions={[5, 10, 20]}
                            responsive
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <p className="text-gray-600 text-sm text-center py-4">
                                    No allowances match your search.
                                </p>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full sm:max-w-md transform transition-all duration-300 ease-in-out hover:shadow-3xl">
                        <div className="text-center">
                            <FaExclamationTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-6">
                                Are you sure you want to delete this allowance? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 transform hover:scale-105"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg hover:bg-gray-400 transition-colors duration-200 transform hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllowanceComponent;