import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DataTable from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CategoryManagement = () => {
    const [collegeOptions, setCollegeOptions] = useState([]);
    const [collegeMap, setCollegeMap] = useState({});
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const fetchColleges = async () => {
        try {
            const response = await fetch('/HRMS/College/GetCollegeList');
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

    const fetchCategories = async () => {
        try {
            const response = await fetch('/HRMS/CategoryDepartment/CategoryList');
            if (!response.ok) throw new Error('Failed to fetch categories');
            let result = await response.json();
            console.log('Fetched categories:', result);
            if (typeof result === "string") {
                try {
                    result = JSON.parse(result);
                } catch (parseError) {
                    console.error('Failed to parse JSON string:', parseError);
                    throw new Error('Invalid JSON response');
                }
            }
            const data = result.dataFetch.table;
            setCategories(data);
            setFilteredCategories(data);
        } catch (error) {
            toast.error(`Error fetching categories: ${error.message}`);
            setCategories([]);
            setFilteredCategories([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchColleges();
            await fetchCategories();
        };
        loadData();
    }, []);

    useEffect(() => {
        const filtered = categories.filter(item =>
            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (collegeMap[item.company] || item.company).toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCategories(filtered);
    }, [searchQuery, categories, collegeMap]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const validateCategory = () => {
        if (!selectedCollege || selectedCollege.value === '0') {
            toast.error('Please select a college');
            return false;
        }
        if (!categoryName.trim()) {
            toast.error('Please enter a category name');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateCategory()) return;

        const categoryData = {
            ctgID: 0,
            compID: parseInt(selectedCollege.value),
            categoryName: categoryName
        };

        try {
            if (isEditing) {
                const response = await fetch('/HRMS/CategoryDepartment/UpdateCategory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ctgID: parseInt(editCategoryId),
                        categoryName: categoryName,
                        compID: parseInt(selectedCollege.value),
                        mainDept: 0
                    })
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to update category');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Category updated successfully!');
                else toast.error('Category not updated!');
            } else {
                const response = await fetch('/HRMS/CategoryDepartment/SaveCategory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoryData)
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to save category');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Category saved successfully!');
                else toast.error('Category not saved!');
            }
            clearForm();
            await fetchCategories();
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const clearForm = () => {
        setCategoryName('');
        setSelectedCollege(null);
        setIsEditing(false);
        setEditCategoryId(null);
    };

    const handleEdit = (row) => {
        setIsEditing(true);
        setEditCategoryId(row.id);
        setCategoryName(row.category);
        setSelectedCollege(collegeOptions.find(option => option.value === row.company));
    };

    const handleDeleteClick = (id) => {
        setCategoryToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            const response = await fetch(`/HRMS/CategoryDepartment/deleteCategory?deptcode=${categoryToDelete}`, {
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
                toast.success('Category deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                await fetchCategories();
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
            setCategoryToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setCategoryToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = categories.map(item => ({
            ID: item.id,
            'Category Name': item.category,
            'Company Name': collegeMap[item.company] || item.company,
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'categories.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Category Name', 'Company Name']],
                body: categories.map(item => [
                    item.id,
                    item.category,
                    collegeMap[item.company] || item.company,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Category Management Details', 14, 10);
                },
            });
            doc.save('categories.pdf');
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error(`Failed to export PDF: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
            });
        }
    };

    const columns = [
        { name: 'Category Name', selector: row => row.category, sortable: true },
        {
            name: 'Company Name',
            selector: row => collegeMap[row.company] || row.company,
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
                        onClick={() => handleDeleteClick(row.id)}
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
        <div className="container mx-auto p-4">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Form Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Category
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="Enter Category"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                {isEditing ? 'Update Category' : 'Save Category'}
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
                    {filteredCategories.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                                Category List
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
                                        placeholder="Search categories..."
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
                                    data={filteredCategories}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    responsive
                                    highlightOnHover
                                    customStyles={customStyles}
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No categories match your search.
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
                                Are you sure you want to delete this category? This action cannot be undone.
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

export default CategoryManagement;