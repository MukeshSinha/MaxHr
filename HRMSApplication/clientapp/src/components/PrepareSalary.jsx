import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaFileCsv, FaFilePdf, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import Select from 'react-select';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PrepareSalary = () => {
    const [ezone, setEzone] = useState(null);
    const [month, setMonth] = useState(null);
    const [year, setYear] = useState('');
    const [type, setType] = useState(null);
    const [category, setCategory] = useState(null);
    const [period, setPeriod] = useState('');
    const [toDate, setToDate] = useState('');
    const [department, setDepartment] = useState(null);
    const [code, setCode] = useState(null);
    const [toCode, setToCode] = useState(null);
    const [salaryData, setSalaryData] = useState([]);
    const [filteredSalaryData, setFilteredSalaryData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [salaryToDelete, setSalaryToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [ezoneOptions, setEzoneOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [codeOptions, setCodeOptions] = useState([]);
    const [toCodeOptions, setToCodeOptions] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const defaultOption = { value: '0', label: '-- Select Option --', isDisabled: true };

    const monthOptions = [
        defaultOption,
        { value: 'January', label: 'January' },
        { value: 'February', label: 'February' },
        { value: 'March', label: 'March' },
        { value: 'April', label: 'April' },
        { value: 'May', label: 'May' },
        { value: 'June', label: 'June' },
        { value: 'July', label: 'July' },
        { value: 'August', label: 'August' },
        { value: 'September', label: 'September' },
        { value: 'October', label: 'October' },
        { value: 'November', label: 'November' },
        { value: 'December', label: 'December' },
    ];

    const typeOptions = [
        defaultOption,
        { value: '1', label: 'Permanent' },
        { value: '2', label: 'Adhoc' },
    ];

    const fetchEzoneList = async () => {
        try {
            const response = await fetch('/HRMS/College/GetCollegeList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch ezone list');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = [defaultOption, ...result.dataFetch.table.map(item => ({
                value: item.college_CODE,
                label: item.college_NAME,
            }))];
            setEzoneOptions(data);
        } catch (error) {
            toast.error(`Error fetching ezone list: ${error.message}`);
            setEzoneOptions([defaultOption]);
        }
    };

    const fetchCategoryList = async () => {
        try {
            const response = await fetch('/HRMS/CategoryDepartment/CategoryList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch category list');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = [defaultOption, ...result.dataFetch.table.map(item => ({
                value: item.id,
                label: item.category,
            }))];
            setCategoryOptions(data);
        } catch (error) {
            toast.error(`Error fetching category list: ${error.message}`);
            setCategoryOptions([defaultOption]);
        }
    };

    const fetchDepartmentList = async () => {
        try {
            const response = await fetch('/HRMS/Department/DepartmentList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch department list');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = [defaultOption, ...result.dataFetch.table.map(item => ({
                value: item.deptCode,
                label: item.dept,
            }))];
            setDepartmentOptions(data);
        } catch (error) {
            toast.error(`Error fetching department list: ${error.message}`);
            setDepartmentOptions([defaultOption]);
        }
    };

    const fetchEmployeeList = async () => {
        if (!ezone || ezone.value === '0' || !type || type.value === '0' || !category || category.value === '0' || !department || department.value === '0') {
            setCodeOptions([defaultOption]);
            setToCodeOptions([defaultOption]);
            return;
        }

        try {
            // Add leading zero to ezone if it's a single digit
            const formattedEzone = ezone.value.length === 1 ? `0${ezone.value}` : ezone.value;
           
            const url = `/HRMS/Employees/SearchEmployeeByALL?ezone=${formattedEzone}&eType=${type.value}&category=${category.value}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch employee list');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = [defaultOption, ...result.dataFetch.table.map(item => ({
                value: item.empCode,
                label: item.empName,
            }))];
            setCodeOptions(data);
            setToCodeOptions(data);
        }
        catch (error) {
            toast.error(`Error fetching employee list: ${error.message}`);
            setCodeOptions([defaultOption]);
            setToCodeOptions([defaultOption]);
        }
    };

    const fetchSalaryData = async () => {
        try {
            const response = await fetch('/HRMS/Salary/SalaryList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch salary data');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                ezone: item.ezone,
                month: item.month,
                year: item.year,
                type: item.type,
                category: item.category,
                period: item.period,
                toDate: item.toDate,
                department: item.department,
                code: item.code,
                toCode: item.toCode,
            }));
            setSalaryData(data);
            setFilteredSalaryData(data);
            setIsDataLoaded(true);
        } catch (error) {
            toast.error(`Error fetching salary data: ${error.message}`);
            setSalaryData([]);
            setFilteredSalaryData([]);
            setIsDataLoaded(false);
        }
    };

    useEffect(() => {
        fetchEzoneList();
        fetchCategoryList();
        fetchDepartmentList();
        fetchSalaryData();
    }, []);

    useEffect(() => {
        fetchEmployeeList();
    }, [ezone, type, category, department]);

    const handleSubmit = async () => {
        if (!ezone || ezone.value === '0' || !month || month.value === '0' || !year || !type || type.value === '0' ||
            !category || category.value === '0' || !period || !toDate || !department || department.value === '0') {
            toast.error('Please fill in all required fields', { position: 'top-center', autoClose: 3000 });
            return;
        }

        const salaryPayload = {
            ezone: ezone.value.length === 1 ? `0${ezone.value}` : ezone.value, // Add leading zero to ezone
            month: month.value,
            year: parseInt(year),
            type: type.value,
            category: category.value,
            period: new Date(period).toISOString(),
            toDate: new Date(toDate).toISOString(),
            department: department.value,
            code: code && code.value !== '0' ? code.value : null,
            toCode: toCode && toCode.value !== '0' ? toCode.value : null,
        };

        try {
            const response = await fetch('/HRMS/Salary/SaveSalary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salaryPayload),
            });
            if (!response.ok) throw new Error('Failed to save salary data');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Salary data saved successfully!', { position: 'top-center', autoClose: 3000 });
                setEzone(null);
                setMonth(null);
                setYear('');
                setType(null);
                setCategory(null);
                setPeriod('');
                setToDate('');
                setDepartment(null);
                setCode(null);
                setToCode(null);
                fetchSalaryData();
            } else {
                throw new Error(result.message || 'Salary data not saved');
            }
        } catch (error) {
            toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const handleDeleteClick = (salaryId) => {
        setSalaryToDelete(salaryId);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!salaryToDelete) return;
        try {
            const response = await fetch(`/HRMS/Salary/deleteSalary?salaryId=${salaryToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete salary data');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Salary data deleted successfully!', { position: 'top-center', autoClose: 3000, toastId: 'delete-success' });
                const updatedData = salaryData.filter(item => item.salaryId !== salaryToDelete);
                setSalaryData(updatedData);
                setFilteredSalaryData(updatedData);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, { position: 'top-center', autoClose: 3000, toastId: 'delete-error' });
        } finally {
            setShowConfirmDialog(false);
            setSalaryToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setSalaryToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = filteredSalaryData.map(item => ({
            ID: item.salaryId,
            Ezone: item.ezone,
            Month: item.month,
            Year: item.year,
            Type: item.type,
            Category: item.category,
            Period: item.period,
            To: item.toDate,
            Department: item.department,
            Code: item.code || '',
            ToCode: item.toCode || '',
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'salary_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Ezone', 'Month', 'Year', 'Type', 'Category', 'Period', 'To', 'Department', 'Code', 'To Code']],
                body: filteredSalaryData.map(item => [
                    item.salaryId,
                    item.ezone,
                    item.month,
                    item.year,
                    item.type,
                    item.category,
                    item.period,
                    item.toDate,
                    item.department,
                    item.code || '',
                    item.toCode || '',
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Salary Management Details', 14, 10);
                },
            });
            doc.save('salary_data.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'Ezone', selector: row => row.ezone, sortable: true },
        { name: 'Month', selector: row => row.month, sortable: true },
        { name: 'Year', selector: row => row.year, sortable: true },
        { name: 'Type', selector: row => row.type, sortable: true },
        { name: 'Category', selector: row => row.category, sortable: true },
        { name: 'Period', selector: row => row.period, sortable: true },
        { name: 'To', selector: row => row.toDate, sortable: true },
        { name: 'Department', selector: row => row.department, sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button onClick={() => handleDeleteClick(row.salaryId)} className="text-red-500 hover:text-red-700" title="Delete">
                        <FaTrash className="w-4 h-4" />
                    </button>
                </div>
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

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Input Fields */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Salary Preparation
                    </h2>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ezone</label>
                            <Select
                                options={ezoneOptions}
                                value={ezone}
                                onChange={setEzone}
                                placeholder="-- Select Option --"
                                className="mt-1 text-sm"
                                isSearchable
                                isOptionDisabled={(option) => option.isDisabled}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Month</label>
                                <Select
                                    options={monthOptions}
                                    value={month}
                                    onChange={setMonth}
                                    placeholder="-- Select Option --"
                                    className="mt-1 text-sm"
                                    isSearchable
                                    isOptionDisabled={(option) => option.isDisabled}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    placeholder="Enter Year"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <Select
                                    options={typeOptions}
                                    value={type}
                                    onChange={setType}
                                    placeholder="-- Select Option --"
                                    className="mt-1 text-sm"
                                    isSearchable
                                    isOptionDisabled={(option) => option.isDisabled}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <Select
                                    options={categoryOptions}
                                    value={category}
                                    onChange={setCategory}
                                    placeholder="-- Select Option --"
                                    className="mt-1 text-sm"
                                    isSearchable
                                    isOptionDisabled={(option) => option.isDisabled}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Period</label>
                                <input
                                    type="date"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">To</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <Select
                                options={departmentOptions}
                                value={department}
                                onChange={setDepartment}
                                placeholder="-- Select Option --"
                                className="mt-1 text-sm"
                                isSearchable
                                isOptionDisabled={(option) => option.isDisabled}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code</label>
                                <Select
                                    options={codeOptions}
                                    value={code}
                                    onChange={setCode}
                                    placeholder="-- Select Option --"
                                    className="mt-1 text-sm"
                                    isSearchable
                                    isOptionDisabled={(option) => option.isDisabled}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">To Code</label>
                                <Select
                                    options={toCodeOptions}
                                    value={toCode}
                                    onChange={setToCode}
                                    placeholder="-- Select Option --"
                                    className="mt-1 text-sm"
                                    isSearchable
                                    isOptionDisabled={(option) => option.isDisabled}
                                />
                            </div>
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
                        Salary List
                    </h3>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            placeholder="Search salary data..."
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                        />
                        <div className="relative w-full sm:w-auto">
                            <button
                                type="button"
                                className="w-full sm:w-auto px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                Export
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 24">
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
                            data={filteredSalaryData.filter(item =>
                                (item.ezone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.month || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.year || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.period || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.toDate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.toCode || '').toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            pagination
                            paginationPerPage={5}
                            paginationRowsPerPageOptions={[5, 10, 20]}
                            responsive
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <p className="text-gray-600 text-sm text-center py-4">
                                    No salary data matches your search.
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
                                Are you sure you want to delete this salary data? This action cannot be undone.
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

export default PrepareSalary;