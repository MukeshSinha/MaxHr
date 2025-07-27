import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DataTable from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DepartmentManagement = () => {
    const [collegeOptions, setCollegeOptions] = useState([]);
    const [collegeMap, setCollegeMap] = useState({});
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [deptName, setDeptName] = useState('');
    const [mainDept, setMainDept] = useState('0');
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editDeptCode, setEditDeptCode] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const fetchColleges = async () => {
        try {
            const response = await fetch('/HRMS/College/GetCollegeList'); // Verify if this should be /HRMS/House/GetCollegeList
            if (!response.ok) throw new Error('Failed to fetch colleges');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const colleges = result.dataFetch.table.map(college => ({
                value: college.college_CODE.replace(/^0+/, ''),
                label: college.college_NAME
            }));
            const collegeMapping = result.dataFetch.table.reduce((map, college) => {
                map[college.college_CODE.replace(/^0+/, '')] = college.college_NAME;
                return map;
            }, {});
            setCollegeOptions([{ value: '0', label: '-- Select College --' }, ...colleges]);
            setCollegeMap(collegeMapping);
            console.log('College Map:', collegeMapping);
        } catch (error) {
            toast.error(`Error fetching colleges: ${error.message}`);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/HRMS/Department/DepartmentList');
            if (!response.ok) throw new Error('Failed to fetch departments');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table;
            setDepartments(data);
            setFilteredDepartments(data);
        } catch (error) {
            toast.error(`Error fetching departments: ${error.message}`);
            setDepartments([]);
            setFilteredDepartments([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchColleges();
            await fetchDepartments();
        };
        loadData();
    }, []);

    useEffect(() => {
        const filtered = departments.filter(item =>
            item.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (collegeMap[item.companyCode] || item.companyCode).toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredDepartments(filtered);
    }, [searchQuery, departments, collegeMap]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const validateDepartment = () => {
        if (!selectedCollege || selectedCollege.value === '0') {
            toast.error('Please select a college');
            return false;
        }
        if (!deptName.trim()) {
            toast.error('Please enter a department name');
            return false;
        }
        if (!mainDept || isNaN(mainDept)) {
            toast.error('Please enter a valid main department number');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateDepartment()) return;

        const deptData = {
            deptCode: 0,
            deptName: deptName,
            compcode: parseInt(selectedCollege.value),
            mainDept: parseInt(mainDept)
        };

        try {
            if (isEditing) {
                const response = await fetch('/HRMS/Department/UpdateDepartment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deptCode: parseInt(editDeptCode),
                        deptName: deptName,
                        compcode: parseInt(selectedCollege.value),
                        mainDept: parseInt(mainDept)
                    })
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to update department');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Department updated successfully!');
                else throw new Error(result.message || 'Department not updated');
            } else {
                const response = await fetch('/HRMS/Department/SaveDepartment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deptData)
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to save department');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Department saved successfully!');
                else throw new Error(result.message || 'Department not saved');
            }
            clearForm();
            await fetchDepartments();
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const clearForm = () => {
        setDeptName('');
        setSelectedCollege(null);
        setMainDept('0');
        setIsEditing(false);
        setEditDeptCode(null);
    };

    const handleEdit = (row) => {
        console.log('row.companyCode:', row.companyCode, 'collegeOptions:', collegeOptions);
        setIsEditing(true);
        setEditDeptCode(row.deptCode);
        setDeptName(row.dept);
        const selectedOption = collegeOptions.find(option => option.value === row.companyCode.toString().trim());
        if (!selectedOption) {
            toast.error('Selected college not found in available options');
            setSelectedCollege(null);
        } else {
            setSelectedCollege(selectedOption);
        }
        setMainDept(row.mainDept.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (deptCode) => {
        setDeptToDelete(deptCode);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!deptToDelete) return;
        try {
            const response = await fetch(`/HRMS/Department/deleteDepartment?deptcode=${deptToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete department');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Department deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                await fetchDepartments();
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
            setDeptToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setDeptToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = departments.map(item => ({
            ID: item.deptCode,
            'Department Name': item.dept,
            'Company Name': collegeMap[item.companyCode] || item.companyCode,
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'departments.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Department Name', 'Company Name']],
                body: departments.map(item => [
                    item.deptCode,
                    item.dept,
                    collegeMap[item.companyCode] || item.companyCode,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Department Management Details', 14, 10);
                },
            });
            doc.save('departments.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
            });
        }
    };

    const columns = [
        { name: 'Department Name', selector: row => row.dept, sortable: true },
        {
            name: 'Company Name',
            selector: row => collegeMap[row.companyCode] || row.companyCode,
            sortable: true
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-green-500 hover:text-green-700"
                        title="Edit"
                    >
                        <FaPencilAlt className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row.deptCode)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                    >
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
        <div className="container mx-auto p-4 max-w-5xl">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Form Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Department Management
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department Name</label>
                            <input
                                type="text"
                                value={deptName}
                                onChange={(e) => setDeptName(e.target.value)}
                                placeholder="Enter department name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">College</label>
                            <Select
                                options={collegeOptions}
                                value={selectedCollege}
                                onChange={setSelectedCollege}
                                placeholder="-- Select College --"
                                className="mt-1"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Main Department</label>
                            <input
                                type="text"
                                value={mainDept}
                                onChange={(e) => setMainDept(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="Enter main department"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                {isEditing ? 'Update Department' : 'Save Department'}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={clearForm}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {filteredDepartments.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                                Department List
                            </h3>
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.preventDefault();
                                        }}
                                        placeholder="Search departments..."
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
                                    data={filteredDepartments}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    responsive
                                    highlightOnHover
                                    customStyles={customStyles}
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No departments match your search.
                                        </p>
                                    }
                                />
                            </div>
                        </div>
                    )}
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
                                Are you sure you want to delete this department? This action cannot be undone.
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

export default DepartmentManagement;