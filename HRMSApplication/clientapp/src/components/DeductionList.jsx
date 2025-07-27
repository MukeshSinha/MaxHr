import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from 'react-data-table-component';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaTrash, FaEdit, FaFileCsv, FaFilePdf } from 'react-icons/fa';

const DeductionList = () => {
    const [empCode, setEmpCode] = useState('');
    const [wefDate, setWefDate] = useState('');
    const [minWefDate, setMinWefDate] = useState('');
    const [isWefDateEnabled, setIsWefDateEnabled] = useState(false);
    const [deductions, setDeductions] = useState([]); // For input fields
    const [deductionList, setDeductionList] = useState([]); // For DataTable
    const [filteredDeductions, setFilteredDeductions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [fixedValues, setFixedValues] = useState({ PF: '', ESI: '', WF: '' });
    const [deductionToDelete, setDeductionToDelete] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);

    const payTypeMap = {
        PF: 'PF',
        ESI: 'ESI',
        WF: 'WF',
    };

    const fetchDeductions = async () => {
        try {
            const response = await fetch('/HRMS/DeductionMaster/DeductionMasterList');
            if (!response.ok) throw new Error('Failed to fetch deductions');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => {
                let dedType = item.dedType;
                if (item.deductionName === 'PF') dedType = 'PF';
                else if (item.deductionName === 'ESI') dedType = 'ESI';
                else if (item.deductionName === 'WF') dedType = 'WF';
                else dedType = item.deductionName;
                return {
                    ...item,
                    dedType,
                    deductionName: item.deductionName,
                    value: ''
                };
            });
            console.log('Fetched deductions:', data); // Debug log
            setDeductions(data);
            setFilteredDeductions(data);
        } catch (error) {
            toast.error(`Error fetching deductions: ${error.message}`);
            setDeductions([]);
            setFilteredDeductions([]);
        }
    };

    const fetchDeductionList = async () => {
        try {
            const response = await fetch('/HRMS/Deduction/GetDeductionList');
            if (!response.ok) throw new Error('Failed to fetch deduction list');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                value: item.value || ''
            }));
            console.log('Fetched deduction list:', data);
            setDeductionList(data);
        } catch (error) {
            toast.error(`Error fetching deduction list: ${error.message}`);
            setDeductionList([]);
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
                const minDate = new Date(doj);
                minDate.setDate(doj.getDate() + 1);
                setMinWefDate(minDate.toISOString().split('T')[0]);
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
        fetchDeductions();
        fetchDeductionList();
    }, []);

    useEffect(() => {
        const filtered = deductions.filter(deduction =>
            deduction.deductionName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDeductions(filtered);
    }, [searchTerm, deductions]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchEmployeeDetails(empCode);
        }, 500);
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

    const handleDeductionChange = (index, value) => {
        const cleanedValue = validateNumericInput(value);
        const updatedDeductions = [...deductions];
        updatedDeductions[index].value = cleanedValue;
        setDeductions(updatedDeductions);
    };

    const handleFixedValueChange = (type, value) => {
        const validatedValue = validateNumericInput(value);
        setFixedValues(prev => ({ ...prev, [type]: validatedValue }));
    };

    const handleWefDateChange = (e) => {
        setWefDate(e.target.value);
    };

    const handleDeleteClick = (did) => {
        setDeductionToDelete(did);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!deductionToDelete) return;
        try {
            const response = await fetch(`/HRMS/Deduction/deleteDeduction?did=${deductionToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete deduction');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Deduction deleted successfully!', { position: 'top-center', autoClose: 3000, toastId: 'delete-success' });
                const updatedList = deductionList.filter(d => d.did !== deductionToDelete);
                setDeductionList(updatedList);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, { position: 'top-center', autoClose: 3000, toastId: 'delete-error' });
        } finally {
            setShowConfirmDialog(false);
            setDeductionToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setDeductionToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = deductionList.map(item => ({
            ID: item.did,
            'Deduction Name': item.deductionName,
            'Pay Type': item.dedType,
            'Value': item.value || 0
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'deductions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Deduction Name', 'Pay Type', 'Value']],
                body: deductionList.map(item => [item.did, item.deductionName, item.dedType, item.value || 0]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Deduction Management Details', 14, 10);
                },
            });
            doc.save('deductions.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'Deduction Name', selector: row => row.deductionName, sortable: true },
        { name: 'Pay Type', selector: row => row.dedType, sortable: true },
        { name: 'Value', selector: row => row.value || '0', sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button onClick={() => handleEditClick(row.did)} className="text-blue-500 hover:text-blue-700" title="Edit">
                        <FaEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(row.did)} className="text-red-500 hover:text-red-700" title="Delete">
                        <FaTrash className="w-4 h-4" />
                    </button>
                </div>
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

    const handleEditClick = (did) => {
        toast.info(`Edit functionality for deduction ID ${did} is not implemented yet.`, { position: 'top-center', autoClose: 3000 });
    };

    const handleSubmit = async () => {
        if (!empCode) {
            toast.error('Please fill in Emp Code', { position: 'top-center', autoClose: 3000 });
            return;
        }
        if (!wefDate) {
            toast.error('Please select WEF Date', { position: 'top-center', autoClose: 3000 });
            return;
        }

        if (minWefDate && new Date(wefDate) < new Date(minWefDate)) {
            toast.error('WEF Date cannot be earlier than or equal to Date of Joining', { position: 'top-center', autoClose: 3000 });
            return;
        }

        const fixedEmpty = Object.values(fixedValues).some(value => value === '');
        if (fixedEmpty) {
            toast.error('Please fill all Fixed Deduction fields (PF, ESI, WF)', { position: 'top-center', autoClose: 3000 });
            return;
        }

        const otherEmpty = filteredDeductions.filter(ded => !['PF', 'ESI', 'WF'].includes(ded.dedType)).some(deduction => !deduction.value || deduction.value === '');
        if (otherEmpty) {
            toast.error('Please fill all Other Deduction fields', { position: 'top-center', autoClose: 3000 });
            return;
        }

        const deductionPayload = {
            empCode,
            wefdate: new Date(wefDate).toISOString(),
            deductionDetail: [
                ...deductions
                    .filter(ded => !['PF', 'ESI', 'WF'].includes(ded.dedType))
                    .map(({ did, value }) => ({
                        headID: did,
                        rates: parseFloat(value) || 0
                    })),
                ...Object.entries(fixedValues).map(([type, value]) => {
                    const ded = deductions.find(ded => ded.dedType === type);
                    const defaultIds = { PF: -1, ESI: -2, WF: -3 };
                    console.log(`Mapping ${type}: did=${ded?.did || defaultIds[type]}, value=${value}`); // Debug log
                    return {
                        headID: ded?.did || defaultIds[type],
                        rates: parseFloat(value) || 0
                    };
                })
            ].filter(detail => detail.rates !== 0) // Removed headID !== 0 filter to allow default IDs
        };
        console.log('Final payload:', deductionPayload); // Debug log

        try {
            const response = await fetch('/HRMS/Deduction/SaveDeduction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deductionPayload)
            });
            if (!response.ok) throw new Error('Failed to save deductions');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Deductions saved successfully!');
                // Clear fields after successful save
                setEmpCode('');
                setWefDate('');
                setFixedValues({ PF: '', ESI: '', WF: '' });
                setDeductions(deductions.map(ded => ({ ...ded, value: '' })));
                setMinWefDate('');
                setIsWefDateEnabled(false);
            } else {
                throw new Error(result.message || 'Deductions not updated');
            }
            fetchDeductions(); // Refresh input deductions
            fetchDeductionList(); // Refresh DataTable data
        } catch (error) {
            toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const rightDeductions = filteredDeductions.filter(ded => !['PF', 'ESI', 'WF'].includes(ded.dedType));

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Side - Deduction Inputs */}
                <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-6">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search by EmpCode..."
                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={empCode}
                            onChange={(e) => setEmpCode(e.target.value)}
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
                            />
                        </svg>
                    </div>

                    <div className="mb-6">
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

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Side - Fixed Deductions */}
                        <div className="w-full md:w-1/2 p-4 bg-gray-50 rounded-md border border-gray-200">
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">Fixed Deductions</h2>
                            {['PF', 'ESI', 'WF'].map((type, index) => (
                                <div key={index} className="mb-2">
                                    <input
                                        type="text"
                                        value={fixedValues[type]}
                                        onChange={(e) => handleFixedValueChange(type, e.target.value)}
                                        placeholder={type}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Horizontal Line between sections */}
                        <div className="hidden md:block border-t border-gray-300 my-4 md:my-0 md:h-auto md:w-px"></div>

                        {/* Right Side - Other Deductions */}
                        <div className="w-full md:w-1/2 p-4 bg-gray-50 rounded-md border border-gray-200" style={{ maxHeight: rightDeductions.length > 5 ? '300px' : 'auto', overflowY: rightDeductions.length > 5 ? 'auto' : 'visible' }}>
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">Other Deductions</h2>
                            {rightDeductions.length > 0 ? (
                                rightDeductions.map((deduction, index) => (
                                    <div key={index} className="mb-2">
                                        <input
                                            type="text"
                                            value={deduction.value || ''}
                                            placeholder={`Enter ${deduction.deductionName}`}
                                            onChange={(e) => handleDeductionChange(deductions.findIndex(d => d.did === deduction.did), e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
                                            data-aid={deduction.did}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-600 text-sm">No other deductions available.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Submit
                        </button>
                    </div>
                </div>

                {/* Right Side - DataTable */}
                <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                        Deduction List
                    </h3>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            placeholder="Search deductions..."
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
                            data={deductionList.filter(item =>
                                item.deductionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.dedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                                    No deductions match your search.
                                </p>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for Delete */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                        <p>Are you sure you want to delete this deduction?</p>
                        <div className="mt-6 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeductionList;