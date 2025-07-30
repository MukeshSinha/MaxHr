import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function ImportEmployee() {
    const [formData, setFormData] = useState({
        branchEzone: '',
        file: null,
        fileContent: [],
    });
    const [errors, setErrors] = useState({});
    const [employeeList, setEmployeeList] = useState([]);
    const [filteredEmployeeList, setFilteredEmployeeList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    // Fetch employee list
    const fetchEmployeeList = async () => {
        try {
            const response = await fetch('/ImportEmployee/GetEmployeeList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result?.dataFetch?.table) {
                const formattedEmployees = result.dataFetch.table.map((item, index) => ({
                    id: index + 1,
                    branchEzone: item.branchEzone || 'N/A',
                    employeeCode: item.employeeCode || 'N/A',
                    amount: item.amount || 'N/A',
                }));
                setEmployeeList(formattedEmployees);
                setFilteredEmployeeList(formattedEmployees);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            toast.error(`Failed to fetch employee list: ${error.message}`, {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'fetch-employee-error',
            });
            setEmployeeList([]);
            setFilteredEmployeeList([]);
        }
    };

    useEffect(() => {
        fetchEmployeeList();
    }, []);

    // Handle input change
    const handleInputChange = (field, value) => {
        if (field === 'file' && value) {
            const file = value.target.files[0];
            if (file && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = e.target.result;
                    if (file.type.includes('csv')) {
                        Papa.parse(data, {
                            complete: (result) => {
                                setFormData({ ...formData, file, fileContent: result.data });
                            },
                            header: true,
                        });
                    } else {
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const sheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(sheet);
                        setFormData({ ...formData, file, fileContent: jsonData });
                    }
                };
                reader.readAsBinaryString(file);
            } else {
                toast.error('Please upload a CSV or Excel file!', {
                    position: 'top-right',
                    autoClose: 3000,
                    toastId: 'file-type-error',
                });
                setFormData({ ...formData, file: null, fileContent: [] });
            }
        } else {
            setFormData({ ...formData, [field]: value });
        }
        if (errors[field]) setErrors({ ...errors, [field]: false });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.branchEzone) newErrors.branchEzone = true;
        if (!formData.file) newErrors.file = true;
        if (formData.fileContent.length === 0) newErrors.fileContent = true;
        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill all required fields and upload a valid file!', {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'validation-error',
            });
            setErrors(newErrors);
            return false;
        }
        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const url = isUpdateMode
                    ? '/ImportEmployee/UpdateEmployee'
                    : '/ImportEmployee/SaveEmployee';
                const payload = {
                    ...formData,
                    branchEzone: formData.branchEzone,
                    fileContent: formData.fileContent,
                };
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                if (result.statusCode === 1) {
                    toast.success(
                        isUpdateMode ? 'Employee updated successfully!' : 'Employee submitted successfully!',
                        {
                            position: 'top-right',
                            autoClose: 3000,
                            toastId: 'submit-success',
                        }
                    );
                    setFormData({
                        branchEzone: '',
                        file: null,
                        fileContent: [],
                    });
                    setErrors({});
                    setIsUpdateMode(false);
                    fetchEmployeeList();
                } else {
                    toast.error(`Failed to ${isUpdateMode ? 'update' : 'submit'} employee: ${result.message || 'Unknown error'}`, {
                        position: 'top-right',
                        autoClose: 3000,
                        toastId: 'submit-error',
                    });
                }
            } catch (error) {
                toast.error(`Failed to ${isUpdateMode ? 'update' : 'submit'} employee: ${error.message}`, {
                    position: 'top-right',
                    autoClose: 3000,
                    toastId: 'submit-error',
                });
            }
        }
    };

    // Handle edit
    const handleEdit = (row) => {
        setFormData({
            branchEzone: row.branchEzone,
            file: null,
            fileContent: [{ employeeCode: row.employeeCode, amount: row.amount }],
        });
        setIsUpdateMode(true);
    };

    // Handle delete
    const handleDeleteClick = (id) => {
        setEmployeeToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        try {
            const response = await fetch(`/ImportEmployee/DeleteEmployee?id=${employeeToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Employee deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                fetchEmployeeList();
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
                toastId: 'delete-error',
            });
        } finally {
            setShowConfirmDialog(false);
            setEmployeeToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setEmployeeToDelete(null);
    };

    // Handle search
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (!query) {
            setFilteredEmployeeList([...employeeList]);
            return;
        }
        const filtered = employeeList.filter((item) =>
            item.branchEzone.toLowerCase().includes(query) ||
            item.employeeCode.toLowerCase().includes(query) ||
            item.amount.toLowerCase().includes(query)
        );
        setFilteredEmployeeList(filtered);
    };

    // Export fields
    const getExportFields = (data) => {
        if (data.length === 0) return [];
        return [
            { key: 'id', label: 'ID' },
            { key: 'branchEzone', label: 'Branch/Ezone' },
            { key: 'employeeCode', label: 'Employee Code' },
            { key: 'amount', label: 'Amount' },
        ];
    };

    // Export to CSV
    const exportToCSV = () => {
        const exportData = filteredEmployeeList.map((item) => ({
            id: item.id,
            branchEzone: item.branchEzone,
            employeeCode: item.employeeCode,
            amount: item.amount,
        }));
        const csv = Papa.unparse(exportData, { columns: getExportFields(exportData).map((field) => field.key) });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'employeeList.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    // Export to PDF
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [getExportFields(filteredEmployeeList).map((field) => field.label)],
                body: filteredEmployeeList.map((item) => [
                    item.id, item.branchEzone, item.employeeCode, item.amount,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                columnStyles: getExportFields(filteredEmployeeList).reduce(
                    (acc, _, index) => ({
                        ...acc,
                        [index]: { cellWidth: 'auto' },
                    }),
                    {}
                ),
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Employee List', 14, 10);
                },
            });
            doc.save('employeeList.pdf');
            setShowExportMenu(false);
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
                toastId: 'export-pdf-error',
            });
        }
    };

    // Download format
    const handleDownloadFormat = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [['Employee Code', 'Amount']];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Format');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'employee_import_format.xlsx');
    };

    // DataTable columns
    const columns = [
        { name: 'ID', selector: (row) => row.id, sortable: true, minWidth: '80px', maxWidth: '120px', wrap: true },
        { name: 'Branch/Ezone', selector: (row) => row.branchEzone, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'Employee Code', selector: (row) => row.employeeCode, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'Amount', selector: (row) => row.amount, sortable: true, minWidth: '120px', maxWidth: '150px', wrap: true },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-800 transition-colors transform hover:scale-110"
                        title="Edit"
                    >
                        <FaPencilAlt className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteClick(row.id)}
                        className="text-red-600 hover:text-red-800 transition-colors transform hover:scale-110"
                        title="Delete"
                    >
                        <FaTrash className="w-4 h-4" />
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            minWidth: '80px',
            maxWidth: '100px',
        },
    ];

    // DataTable custom styles
    const customStyles = {
        table: { style: { width: '100%', tableLayout: 'auto' } },
        tableWrapper: { style: { width: '100%', overflowX: 'auto', maxHeight: '40vh', border: '1px solid #e5e7eb', borderRadius: '8px' } },
        headRow: { style: { backgroundColor: '#e5e7eb', color: '#1f2937', position: 'sticky', top: 0, zIndex: 1, minWidth: '100%' } },
        headCells: { style: { fontWeight: '600', fontSize: '12px', padding: '8px', whiteSpace: 'normal', wordBreak: 'break-word' } },
        cells: { style: { fontSize: '12px', padding: '8px', whiteSpace: 'normal', wordBreak: 'break-word', borderBottom: '1px solid #e5e7eb' } },
        rows: {
            style: {
                '&:nth-child(even)': { backgroundColor: '#dbeafe' },
                '&:nth-child(odd)': { backgroundColor: '#ffffff' },
                '&:hover': { backgroundColor: '#bfdbfe', transition: 'background-color 0.2s' },
            },
        },
        pagination: { style: { borderTop: '1px solid #e5e7eb', padding: '8px', fontSize: '12px', flexWrap: 'wrap' } },
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Import Employee</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full">
                            <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                Branch/Ezone
                                <span className="ml-2">🏠</span>
                            </label>
                            <div className="flex items-center w-full">
                                <input
                                    type="text"
                                    value={formData.branchEzone}
                                    onChange={(e) => handleInputChange('branchEzone', e.target.value)}
                                    className={`w-full p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.branchEzone ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Branch/Ezone..."
                                />
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleDownloadFormat(); }}
                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                    Download Format
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full">
                            <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                Browse
                                <span className="ml-2">📁</span>
                            </label>
                            <input
                                type="file"
                                accept=".csv, .xls, .xlsx"
                                onChange={(e) => handleInputChange('file', e)}
                                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.file ? 'border-2 border-red-500' : 'border-gray-300'}`}
                            />
                        </div>
                    </div>
                    {formData.fileContent.length > 0 && (
                        <div className="w-full overflow-x-auto">
                            <div className={`overflow-y-auto ${formData.fileContent.length > 8 ? 'max-h-64' : ''}`}>
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            {Object.keys(formData.fileContent[0]).map((header, index) => (
                                                <th key={index} className="px-4 py-2">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.fileContent.map((row, index) => (
                                            <tr key={index} className="bg-white border-b">
                                                {Object.values(row).map((value, idx) => (
                                                    <td key={idx} className="px-4 py-2">{value || 'N/A'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <div className="text-center">
                        <p className="text-sm text-gray-700 font-medium">
                            Total Employees: {formData.fileContent.length}
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm"
                        >
                            {isUpdateMode ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>

                {filteredEmployeeList.length > 0 && (
                    <div className="mt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Employee List</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    placeholder="Search employees..."
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
                        </div>
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={columns}
                                data={filteredEmployeeList}
                                customStyles={customStyles}
                                pagination
                                paginationPerPage={5}
                                paginationRowsPerPageOptions={[5, 10, 20]}
                                highlightOnHover
                                pointerOnHover
                                responsive
                                noDataComponent={
                                    <p className="text-gray-600 text-sm text-center py-4">
                                        No employees match your search.
                                    </p>
                                }
                            />
                        </div>
                    </div>
                )}

                {showConfirmDialog && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full sm:max-w-md">
                            <div className="text-center">
                                <FaExclamationTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4 animate-pulse" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Are you sure you want to delete this employee? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ToastContainer />
            </div>
        </div>
    );
}

export default ImportEmployee;