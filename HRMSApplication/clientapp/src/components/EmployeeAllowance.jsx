import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DataTable from 'react-data-table-component';
import { FaFileCsv, FaFilePdf, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

const EmployeeAllowance = () => {
    const [allowanceType, setAllowanceType] = useState('Arrear');
    const [empCode, setEmpCode] = useState('');
    const [empDetails, setEmpDetails] = useState({ name: '', department: '', designation: '', doj: '' });
    const [amount, setAmount] = useState('');
    const [forMonth, setForMonth] = useState(null);
    const [year, setYear] = useState('');
    const [isBulkUpload, setIsBulkUpload] = useState(false);
    const [bulkMonth, setBulkMonth] = useState(null);
    const [bulkYear, setBulkYear] = useState('');
    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [allowanceList, setAllowanceList] = useState([]);
    const fileInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [allowanceToDelete, setAllowanceToDelete] = useState(null);

    const months = [
        { value: 'January', label: 'January', number: 1 },
        { value: 'February', label: 'February', number: 2 },
        { value: 'March', label: 'March', number: 3 },
        { value: 'April', label: 'April', number: 4 },
        { value: 'May', label: 'May', number: 5 },
        { value: 'June', label: 'June', number: 6 },
        { value: 'July', label: 'July', number: 7 },
        { value: 'August', label: 'August', number: 8 },
        { value: 'September', label: 'September', number: 9 },
        { value: 'October', label: 'October', number: 10 },
        { value: 'November', label: 'November', number: 11 },
        { value: 'December', label: 'December', number: 12 },
    ];

    const fetchEmployeeDetails = async (code) => {
        setEmpDetails({ name: '', department: '', designation: '', doj: '' });
        if (!code) return;
        try {
            const response = await fetch(`/HRMS/Employees/SearchEmployeeByCode?empCode=${code}`);
            if (!response.ok) throw new Error('Failed to fetch employee details');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const employeeData = result.dataFetch?.table[0];
            if (employeeData) {
                setEmpDetails({
                    name: employeeData.empName || '',
                    department: employeeData.department || '',
                    designation: employeeData.desig || '',
                    doj: employeeData.doj ? new Date(employeeData.doj).toLocaleDateString() : '',
                });
            }
        } catch (error) {
            toast.error(`Error fetching employee details: ${error.message}`);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchEmployeeDetails(empCode);
        }, 500);
        return () => clearTimeout(debounce);
    }, [empCode]);

    const fetchAllowanceList = async () => {
        if (!empCode || !forMonth || !year || year.length !== 4 || isNaN(year)) return;
        try {
            const url = `/HRMS/EmpMonthlyAllowance/EmpMonthlyAllowanceList?empcode=${empCode}&Mm=${forMonth.number}&Yy=${year}&allowancetype=${allowanceType}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch allowance list');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            if (result && result.dataFetch.table) {
                setAllowanceList(result.dataFetch.table);
            } else {
                setAllowanceList([]);
                toast.error('No allowance data found', { position: 'top-center', autoClose: 3000 });
            }
        } catch (error) {
            toast.error(`Error fetching allowance list: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    useEffect(() => {
        fetchAllowanceList();
    }, [empCode, forMonth, year, allowanceType]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'application/vnd.ms-excel' || file.type === 'text/csv' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        const headers = jsonData[0] || [];
                        const rows = jsonData.slice(1).filter(row => row.length > 0);
                        setHeaders(headers);
                        setFileData(rows);
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        toast.error(`Error parsing file: ${error.message}`, { position: 'top-center', autoClose: 3000 });
                        setSelectedFile(null);
                        setFileData([]);
                        setHeaders([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                toast.error('Please upload only Excel or CSV files', { position: 'top-center', autoClose: 3000 });
                setSelectedFile(null);
                setFileData([]);
                setHeaders([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const downloadFormat = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [{ 'empCode': '', 'amount': '' }];
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'AllowanceFormat');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Allowance_Format.xlsx');
    };

    const handleSubmit = async () => {
        if (!empCode) {
            toast.error('Please fill employee code', { position: 'top-center', autoClose: 3000 });
            return;
        }
        if (!amount || !forMonth || !year) {
            toast.error('Please fill all fields', { position: 'top-center', autoClose: 3000 });
            return;
        }
        try {
            const payload = {
                allowanceType: allowanceType,
                amountList: [{
                    empCode: empCode,
                    mm: forMonth.number,
                    yy: parseInt(year),
                    amount: parseFloat(amount)
                }]
            };
            const response = await fetch('/HRMS/Deduction/SaveEmpMonthlyAllowance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to submit allowance');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Allowance submitted successfully!', { position: 'top-center', autoClose: 3000 });
                setEmpCode('');
                setAmount('');
                setForMonth(null);
                setYear('');
                setEmpDetails({ name: '', department: '', designation: '', doj: '' });
                fetchAllowanceList(); // Refresh the allowance list after submission
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to upload', { position: 'top-center', autoClose: 3000 });
            return;
        }
        if (!bulkMonth || !bulkYear) {
            toast.error('Please select month and year for bulk upload', { position: 'top-center', autoClose: 3000 });
            return;
        }
        try {
            const payload = {
                allowanceType: allowanceType,
                amountList: fileData.map(row => {
                    const empCodeIndex = headers.indexOf('empCode');
                    const amountIndex = headers.indexOf('amount');
                    return {
                        empCode: row[empCodeIndex] || '',
                        mm: bulkMonth.number,
                        yy: parseInt(bulkYear),
                        amount: parseFloat(row[amountIndex]) || 0
                    };
                }).filter(item => item.empCode && !isNaN(item.amount))
            };
            const response = await fetch('/HRMS/EmpMonthlyAllowance/SaveEmpMonthlyAllowance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to upload bulk allowances');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Bulk allowances uploaded successfully!', { position: 'top-center', autoClose: 3000 });
                setSelectedFile(null);
                setFileData([]);
                setHeaders([]);
                setBulkMonth(null);
                setBulkYear('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsBulkUpload(false); // Uncheck bulk upload and hide fields
                fetchAllowanceList(); // Refresh allowance list
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            toast.error(`Upload failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'Allowance Name', selector: row => row.allowanceName || row.empCode, sortable: true },
        { name: 'Pay Type', selector: row => row.allowType || allowanceType, sortable: true },
        { name: 'Value', selector: row => row.value || row.amount || '0', sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <button
                    onClick={() => handleDeleteClick(row.aid || row.empCode + row.mm + row.yy)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                >
                    <FaTrash className="w-4 h-4" />
                </button>
            ),
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

    const filteredAllowances = allowanceList.filter(item =>
        (item.allowanceName || item.empCode).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.allowType || allowanceType).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.value || item.amount || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToCSV = () => {
        const exportData = filteredAllowances.map(item => ({
            ID: item.aid || (item.empCode + item.mm + item.yy),
            'Allowance Name': item.allowanceName || item.empCode,
            'Pay Type': item.allowType || allowanceType,
            'Value': item.value || item.amount || 0,
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'allowances.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Allowance Name', 'Pay Type', 'Value']],
                body: filteredAllowances.map(item => [
                    item.aid || (item.empCode + item.mm + item.yy),
                    item.allowanceName || item.empCode,
                    item.allowType || allowanceType,
                    item.value || item.amount || 0,
                ]),
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
        setShowExportMenu(false);
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
                const updatedAllowances = allowanceList.filter(a => (a.aid || (a.empCode + a.mm + a.yy)) !== allowanceToDelete);
                setAllowanceList(updatedAllowances);
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

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">Monthly Allowances</h2>

                {/* Allowance Type */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowance Type</label>
                    <div className="flex space-x-6">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="Arrear"
                                checked={allowanceType === 'Arrear'}
                                onChange={(e) => setAllowanceType(e.target.value)}
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            Arrear
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="Incentive"
                                checked={allowanceType === 'Incentive'}
                                onChange={(e) => setAllowanceType(e.target.value)}
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            Incentive
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="Exgratia"
                                checked={allowanceType === 'Exgratia'}
                                onChange={(e) => setAllowanceType(e.target.value)}
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            Exgratia
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="Special Allowance"
                                checked={allowanceType === 'Special Allowance'}
                                onChange={(e) => setAllowanceType(e.target.value)}
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            Special Allowance
                        </label>
                    </div>
                </div>

                {/* Employee Code */}
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Enter Employee Code"
                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={empCode}
                        onChange={(e) => setEmpCode(e.target.value)}
                        onBlur={() => fetchEmployeeDetails(empCode)}
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

                {/* Employee Details */}
                {empDetails.name && (
                    <div className="mb-6 p-2 bg-[rgba(255,128,64,0.9)] text-white rounded-md flex flex-wrap justify-between items-center gap-2">
                        <div className="flex flex-wrap space-x-2 text-sm">
                            <p><strong>Employee Name:</strong> {empDetails.name}</p>
                            <p><strong>Department:</strong> {empDetails.department}</p>
                            <p><strong>Designation:</strong> {empDetails.designation}</p>
                            <p><strong>DOJ:</strong> {empDetails.doj}</p>
                        </div>
                    </div>
                )}

                {/* Amount, For Month, Year */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isBulkUpload}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Enter Amount"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-gray-700">For Month</label>
                        <Select
                            value={forMonth}
                            onChange={setForMonth}
                            options={months}
                            isDisabled={isBulkUpload}
                            className="mt-1 text-sm"
                            placeholder="Select Month"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <input
                            type="text"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            disabled={isBulkUpload}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Enter Year"
                        />
                    </div>
                </div>

                {/* For Bulk Upload and Download Format */}
                <div className="mb-6 flex items-center justify-between">
                    <label className="flex items-center text-sm">
                        <input
                            type="checkbox"
                            checked={isBulkUpload}
                            onChange={(e) => setIsBulkUpload(e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        For Bulk Upload
                    </label>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); downloadFormat(); }}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        Download Format
                    </a>
                </div>

                {/* File Upload and Data Display (Conditional on isBulkUpload) */}
                {isBulkUpload && (
                    <>
                        {/* Month Of and Year for Bulk Upload */}
                        <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-gray-700">Month Of</label>
                                <Select
                                    value={bulkMonth}
                                    onChange={setBulkMonth}
                                    options={months}
                                    className="mt-1 text-sm"
                                    placeholder="Select Month"
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    value={bulkYear}
                                    onChange={(e) => setBulkYear(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Year"
                                />
                            </div>
                        </div>

                        {/* Choose File */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700">Choose File</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={handleFileUpload}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {fileData.length > 0 && (
                            <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-md overflow-y-auto" style={{ maxHeight: '200px' }}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            {headers.map((header, index) => (
                                                <th key={index} className="border-b border-gray-300 p-2 text-left font-semibold">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fileData.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border-b border-gray-300">
                                                {headers.map((header, colIndex) => (
                                                    <td key={colIndex} className="p-2">{row[colIndex] || ''}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <button
                                onClick={handleUpload}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Upload
                            </button>
                        </div>
                    </>
                )}
                {!isBulkUpload && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors mr-2"
                        >
                            Submit
                        </button>
                    </div>
                )}
            </div>

            {/* DataTable Section (Moved to the end and conditional on year) */}
            {year && allowanceList.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
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
                            data={filteredAllowances}
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
            )}

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

export default EmployeeAllowance;