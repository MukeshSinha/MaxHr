import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmployeeMaster = () => {
    const [formData, setFormData] = useState({
        general: {
            college: null,
            employeeCode: '',
            employeeCategory: null,
            employeeType: null,
            empName: '',
            fatherName: '',
            dob: '',
            doj: '',
            dept: '',
            desgn: '',
            phoneNo: '',
            aadharNo: '',
            panNo: '',
            uanNo: '',
            report: null,
        },
        personal: {
            maritalStatus: null,
            religion: null,
            bloodGroup: null,
            anniversaryDate: '',
            familyMembers: [{ memberName: '', birthDate: '', relation: '', percent: '', isNominee: null }],
        },
        education: [{ course: '', institute: '', passingYear: '', stream: '', specialization: '' }],
        experience: [{ companyName: '', expDesignation: '', period: '', expContactNo: '' }],
        contact: {
            permHouseNo: '',
            permLocality: '',
            permArea: '',
            permDistrict: '',
            permState: '',
            permPincode: '',
            corrHouseNo: '',
            corrLocality: '',
            corrArea: '',
            corrDistrict: '',
            corrState: '',
            corrPincode: '',
            officialEmail: '',
            personalEmail: '',
            emergencyContact: '',
        },
        documents: {
            addressProofs: [{ proofType: null, refNo: '', file: null }],
            idProofs: [{ proofType: null, refNo: '', file: null }],
        },
        bank: {
            accountNo: '',
            ifsc: '',
            branch: '',
            bankAddress: '',
        },
        insurance: [{ insuranceType: '', policyNo: '', insuranceRefNo: '', premium: '', premiumFrequency: null }],
        colleges: [],
    });

    const [collegeOptions, setCollegeOptions] = useState([]);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [reportOptions, setReportOptions] = useState([]);
    const [activeTab, setActiveTab] = useState('general');

    const isGeneralInfoValid = () => {
        const { general } = formData;
        return (
            general.college &&
            general.employeeCode &&
            general.employeeCategory &&
            general.employeeType &&
            general.empName &&
            /^[a-zA-Z\s]+$/.test(general.empName) &&
            general.fatherName &&
            /^[a-zA-Z\s]+$/.test(general.fatherName) &&
            general.dob &&
            general.doj &&
            general.dept &&
            general.desgn &&
            general.phoneNo &&
            general.aadharNo
        );
    };

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await fetch("/HRMS/College/GetCollegeList", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    
                });
                let data = await response.json();
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
                console.log("College data is:", data);
                if (response.ok) {
                    const options = data.dataFetch.table.map(item => ({
                        value: item.college_CODE,
                        label: item.college_NAME,
                    }));
                    setCollegeOptions(options);
                    setFormData(prev => ({ ...prev, colleges: options }));
                }
                else {
                    toast.error('Failed to fetch college list');
                }
            }
            catch (error) {
                console.error('Error fetching colleges:', error);
                toast.error('Failed to fetch college list');
            }
        };
        fetchColleges();
    }, []);

    //useEffect(() => {
    //    const fetchEmployees = async () => {
    //        try {
    //            const response = await fetch('/api/HRMS/Employees/SearchTeacherByCategory?empcategory=1');
    //            const data = await response.json();
    //            const options = data.map(item => ({
    //                value: item.empCode,
    //                label: item.empName,
    //            }));
    //            setEmployeeOptions(options);
    //        } catch (error) {
    //            console.error('Error fetching employees:', error);
    //            toast.error('Failed to fetch employee list');
    //        }
    //    };
    //    fetchEmployees();
    //}, []);

    const fetchReportOptions = async (collegeId) => {
        if (!collegeId) return;
        try {
            const response = await fetch(`/HRMS/Employees/SearchEmployee?CollegeID=${collegeId}`);
            const data = await response.json();
            const options = data.map(item => ({
                value: item.empCode,
                label: `${item.empName} - ${item.desig}`,
            }));
            setReportOptions(options);
        } catch (error) {
            console.error('Error fetching report options:', error);
            toast.error('Failed to fetch report options');
        }
    };

    const handleInputChange = (section, field, value, index = null) => {
        setFormData(prev => {
            if (index !== null) {
                const updatedArray = [...prev[section]];
                updatedArray[index] = { ...updatedArray[index], [field]: value };
                return { ...prev, [section]: updatedArray };
            }
            return { ...prev, [section]: { ...prev[section], [field]: value } };
        });
    };

    const handleSelectChange = (section, field, option, index = null) => {
        setFormData(prev => {
            if (index !== null) {
                const updatedArray = [...prev[section]];
                updatedArray[index] = { ...updatedArray[index], [field]: option };
                return { ...prev, [section]: updatedArray };
            }
            return { ...prev, [section]: { ...prev[section], [field]: option } };
        });
        if (section === 'general' && field === 'college') {
            fetchReportOptions(option?.value);
        }
    };

    const addRow = (section) => {
        setFormData(prev => ({
            ...prev,
            [section]: [
                ...prev[section],
                section === 'personal.familyMembers'
                    ? { memberName: '', birthDate: '', relation: '', percent: '', isNominee: null }
                    : section === 'education'
                        ? { course: '', institute: '', passingYear: '', stream: '', specialization: '' }
                        : section === 'experience'
                            ? { companyName: '', expDesignation: '', period: '', expContactNo: '' }
                            : section === 'documents.addressProofs'
                                ? { proofType: null, refNo: '', file: null }
                                : section === 'documents.idProofs'
                                    ? { proofType: null, refNo: '', file: null }
                                    : { insuranceType: '', policyNo: '', insuranceRefNo: '', premium: '', premiumFrequency: null },
            ],
        }));
    };

    const removeRow = (section, index) => {
        setFormData(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index),
        }));
    };

    const handleFileChange = (section, index, e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData(prev => {
                    const updatedArray = [...prev[section]];
                    updatedArray[index] = { ...updatedArray[index], file, preview: reader.result };
                    return { ...prev, [section]: updatedArray };
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const saveGeneralInfo = async (e) => {
        e.preventDefault();
        const { general } = formData;
        if (!general.college) return toast.error('Please select a college');
        if (!general.employeeCode) return toast.error('Please fill employee code');
        if (!general.employeeCategory) return toast.error('Please select employee category');
        if (!general.employeeType) return toast.error('Please select employee type');
        if (!general.empName || !/^[a-zA-Z\s]+$/.test(general.empName)) return toast.error('Please enter a valid employee name (alphabets only)');
        if (!general.fatherName || !/^[a-zA-Z\s]+$/.test(general.fatherName)) return toast.error('Please enter a valid father name (alphabets only)');
        if (!general.dob) return toast.error('Please fill date of birth');
        if (!general.doj) return toast.error('Please fill date of joining');
        if (!general.dept) return toast.error('Please fill department');
        if (!general.desgn) return toast.error('Please fill designation');
        if (!general.phoneNo) return toast.error('Please fill contact number');
        if (!general.aadharNo) return toast.error('Please fill Aadhar number');

        try {
            const response = await fetch('/api/HRMS/Employees/SaveEmployee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ezn: general.college?.value,
                    empCode: general.employeeCode,
                    empCategory: general.employeeCategory?.value,
                    empType: general.employeeType?.value,
                    empName: general.empName,
                    fatherName: general.fatherName,
                    dob: general.dob,
                    doj: general.doj,
                    dept: general.dept,
                    desgn: general.desgn,
                    contact: general.phoneNo,
                    aadhar: general.aadharNo,
                    pan: general.panNo,
                    uan: general.uanNo,
                }),
            });
            const data = await response.json();
            if (data.statusCode === 1) {
                toast.success('Employee added successfully!');
                setFormData(prev => ({
                    ...prev,
                    general: {
                        college: null,
                        employeeCode: '',
                        employeeCategory: null,
                        employeeType: null,
                        empName: '',
                        fatherName: '',
                        dob: '',
                        doj: '',
                        dept: '',
                        desgn: '',
                        phoneNo: '',
                        aadharNo: '',
                        panNo: '',
                        uanNo: '',
                        report: null,
                    },
                }));
            } else {
                toast.error(data.message || 'Error saving employee');
            }
        } catch (error) {
            toast.error('Error saving employee data');
        }
    };

    const savePersonalInfo = async (e) => {
        e.preventDefault();
        const { personal, general } = formData;
        if (!general.employeeCode) return toast.error('Please fill employee code');
        if (!personal.maritalStatus) return toast.error('Please select marital status');
        if (!personal.religion) return toast.error('Please select religion');
        if (!personal.bloodGroup) return toast.error('Please select blood group');
        if (!personal.anniversaryDate) return toast.error('Please fill anniversary date');

        try {
            const response = await fetch('/api/HRMS/Employees/savePersonalInfo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    empCode: general.employeeCode,
                    marital: personal.maritalStatus?.value,
                    religon: personal.religion?.value,
                    bloodGroup: personal.bloodGroup?.value,
                    anivDate: personal.anniversaryDate,
                }]),
            });
            const data = await response.json();
            if (data.statusCode === 1) {
                toast.success('Personal info saved successfully!');
                setFormData(prev => ({
                    ...prev,
                    personal: {
                        maritalStatus: null,
                        religion: null,
                        bloodGroup: null,
                        anniversaryDate: '',
                        familyMembers: prev.personal.familyMembers,
                    },
                }));
            } else {
                toast.error(data.message || 'Error saving personal info');
            }
        } catch (error) {
            toast.error('Error saving personal info');
        }
    };

    const saveFamilyMembers = async (e) => {
        e.preventDefault();
        const { personal, general } = formData;
        if (!general.employeeCode) return toast.error('Please fill employee code');
        for (let i = 0; i < personal.familyMembers.length; i++) {
            const MEMBER = personal.familyMembers[i];
            if (!MEMBER.memberName) return toast.error(`Please fill member name in row ${i + 1}`);
            if (!MEMBER.birthDate) return toast.error(`Please fill birth date in row ${i + 1}`);
            if (!MEMBER.relation) return toast.error(`Please fill relation in row ${i + 1}`);
            if (!MEMBER.percent || isNaN(parseInt(MEMBER.percent)) || parseInt(MEMBER.percent) <= 0)
                return toast.error(`Please fill a valid percentage in row ${i + 1}`);
        }

        try {
            const response = await fetch('/api/HRMS/Employees/saveFamilyMemberNominee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(personal.familyMembers.map(MEMBER => ({
                    empCode: general.employeeCode,
                    memberName: MEMBER.memberName,
                    birthDate: MEMBER.birthDate,
                    relation: MEMBER.relation,
                    percentage: parseInt(MEMBER.percent),
                    isNominee: MEMBER.isNominee?.value === 'true',
                }))),
            });
            const data = await response.json();
            if (data.statusCode === 1) {
                toast.success('Family members saved successfully!');
                setFormData(prev => ({
                    ...prev,
                    personal: {
                        ...prev.personal,
                        familyMembers: [{ memberName: '', birthDate: '', relation: '', percent: '', isNominee: null }],
                    },
                }));
            } else {
                toast.error(data.message || 'Error saving family members');
            }
        } catch (error) {
            toast.error('Error saving family members');
        }
    };

    const saveExperience = async (e) => {
        e.preventDefault();
        const { experience, general } = formData;
        if (!general.employeeCode) return toast.error('Please fill employee code');
        for (let i = 0; i < experience.length; i++) {
            const exp = experience[i];
            if (!exp.companyName) return toast.error(`Please fill company name in row ${i + 1}`);
            if (!exp.expDesignation) return toast.error(`Please fill designation in row ${i + 1}`);
            if (!exp.period) return toast.error(`Please fill period in row ${i + 1}`);
            if (!exp.expContactNo) return toast.error(`Please fill contact number in row ${i + 1}`);
        }

        try {
            const response = await fetch('/api/HRMS/Employees/saveExperinceDetails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(experience.map(exp => ({
                    empCode: general.employeeCode,
                    compName: exp.companyName,
                    desig: exp.expDesignation,
                    period: exp.period,
                    contactNo: exp.expContactNo,
                }))),
            });
            const data = await response.json();
            if (data.statusCode === 1) {
                toast.success('Experience details saved successfully!');
                setFormData(prev => ({
                    ...prev,
                    experience: [{ companyName: '', expDesignation: '', period: '', expContactNo: '' }],
                }));
            } else {
                toast.error(data.message || 'Error saving experience details');
            }
        } catch (error) {
            toast.error('Error saving experience details');
        }
    };

    const searchEmployee = async () => {
        const empCode = formData.general.employeeCode;
        if (!empCode) return toast.error('Please enter an employee code');

        try {
            const response = await fetch(`/HRMS/Employees/SearchEmployeeByCode?empCode=${empCode}`);
            let data = await response.json();
            if (response.ok) {
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
                if (!data.dataFetch || data.dataFetch.table.length === 0) {
                    toast.error('Employee not found');
                    return;
                }
                else {
                    const generalData = data.dataFetch.table[0];
                    const personalData = data.dataFetch.table1[0];
                    const educationData = data.dataFetch.table2;
                    const familyData = data.dataFetch.table3;
                    const experienceData = data.dataFetch.table4;

                    setFormData(prev => ({
                        ...prev,
                        general: {
                            college: collegeOptions.find(opt => opt.value === generalData.ezone) || null,
                            employeeCode: generalData.empCode,
                            employeeCategory: { value: generalData.category, label: generalData.category === '1' ? 'Teaching' : 'Non Teaching' },
                            employeeType: { value: generalData.eType, label: generalData.eType === '1' ? 'Permanent' : 'Ad hoc' },
                            empName: generalData.empName,
                            fatherName: generalData.fname,
                            dob: formatDate(generalData.dob),
                            doj: formatDate(generalData.doj),
                            dept: generalData.department,
                            desgn: generalData.desig,
                            phoneNo: generalData.contact,
                            aadharNo: generalData.aadhar,
                            panNo: generalData.pan,
                            uanNo: generalData.uan,
                            report: reportOptions.find(opt => opt.value === generalData.report) || null,
                        },
                        personal: {
                            maritalStatus: personalData ? { value: personalData.marital, label: personalData.marital } : null,
                            religion: personalData ? { value: personalData.religion, label: personalData.religion } : null,
                            bloodGroup: personalData ? { value: personalData.bloodGroup, label: personalData.bloodGroup } : null,
                            anniversaryDate: personalData ? formatDate(personalData.anivDate) : '',
                            familyMembers: familyData.length > 0 ? familyData.map(member => ({
                                memberName: member.memberName,
                                birthDate: formatDate(member.birthDt),
                                relation: member.relation,
                                percent: member.percnt,
                                isNominee: { value: member.isNom.toString(), label: member.isNom ? 'True' : 'False' },
                            })) : [{ memberName: '', birthDate: '', relation: '', percent: '', isNominee: null }],
                        },
                        education: educationData.length > 0 ? educationData.map(edu => ({
                            course: edu.course,
                            institute: edu.institute,
                            passingYear: edu.passyr,
                            stream: edu.trade,
                            specialization: edu.spl,
                        })) : [{ course: '', institute: '', passingYear: '', stream: '', specialization: '' }],
                        experience: experienceData.length > 0 ? experienceData.map(exp => ({
                            companyName: exp.company,
                            expDesignation: exp.desig,
                            period: exp.period,
                            expContactNo: exp.contactNo,
                        })) : [{ companyName: '', expDesignation: '', period: '', expContactNo: '' }],
                        contact: {
                            permHouseNo: generalData.permHouseNo || '',
                            permLocality: generalData.permLocality || '',
                            permArea: generalData.permArea || '',
                            permDistrict: generalData.permDistrict || '',
                            permState: generalData.permState || '',
                            permPincode: generalData.permPincode || '',
                            corrHouseNo: generalData.corrHouseNo || '',
                            corrLocality: generalData.corrLocality || '',
                            corrArea: generalData.corrArea || '',
                            corrDistrict: generalData.corrDistrict || '',
                            corrState: generalData.corrState || '',
                            corrPincode: generalData.corrPincode || '',
                            officialEmail: generalData.officialEmail || '',
                            personalEmail: generalData.personalEmail || '',
                            emergencyContact: generalData.emergencyContact || '',
                        },
                        bank: {
                            accountNo: generalData.accountNo || '',
                            ifsc: generalData.ifsc || '',
                            branch: generalData.branch || '',
                            bankAddress: generalData.bankAddress || '',
                        },
                        insurance: generalData.insurance?.length > 0 ? generalData.insurance.map(ins => ({
                            insuranceType: ins.insuranceType,
                            policyNo: ins.policyNo,
                            insuranceRefNo: ins.insuranceRefNo,
                            premium: ins.premium,
                            premiumFrequency: premiumFrequencyOptions.find(opt => opt.value === ins.premiumFrequency) || null,
                        })) : [{ insuranceType: '', policyNo: '', insuranceRefNo: '', premium: '', premiumFrequency: null }],
                    }));
                    toast.success('Employee data loaded successfully!');
                }
            }
            else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
            toast.error('Error fetching employee data');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    };

    const categoryOptions = [
        { value: '1', label: 'Teaching' },
        { value: '2', label: 'Non Teaching' },
    ];
    const typeOptions = [
        { value: '1', label: 'Permanent' },
        { value: '2', label: 'Ad hoc' },
    ];
    const maritalStatusOptions = [
        { value: 'Single', label: 'Single' },
        { value: 'Married', label: 'Married' },
        { value: 'Divorced', label: 'Divorced' },
    ];
    const religionOptions = [
        { value: 'Hindu', label: 'Hindu' },
        { value: 'Muslim', label: 'Muslim' },
        { value: 'Christian', label: 'Christian' },
        { value: 'Other', label: 'Other' },
    ];
    const bloodGroupOptions = [
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' },
    ];
    const nomineeOptions = [
        { value: 'true', label: 'True' },
        { value: 'false', label: 'False' },
    ];
    const addressProofOptions = [
        { value: 'Electricity Bill', label: 'Electricity Bill' },
        { value: 'Bank Passbook', label: 'Bank Passbook' },
        { value: 'Passport', label: 'Passport' },
        { value: 'Voter ID', label: 'Voter ID' },
    ];
    const idProofOptions = [
        { value: 'PAN', label: 'PAN' },
        { value: 'Aadhar', label: 'Aadhar' },
        { value: 'Voter ID', label: 'Voter ID' },
        { value: 'Birth Certificate', label: 'Birth Certificate' },
    ];
    const premiumFrequencyOptions = [
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Yearly', label: 'Yearly' },
        { value: 'Half-Yearly', label: 'Half Yearly' },
        { value: 'Quarterly', label: 'Quarterly' },
    ];

    const tabs = [
        { id: 'general', label: 'General Info', icon: '👤' },
        { id: 'personal', label: 'Personal Info', icon: '🏠' },
        { id: 'education', label: 'Educational & Experience', icon: '🎓' },
        { id: 'contact', label: 'Contact Info', icon: '📞' },
        { id: 'documents', label: 'Documents', icon: '📝' },
        { id: 'bank', label: 'Bank Details', icon: '🏦' },
        { id: 'insurance', label: 'Insurance', icon: '🛡️' },
        { id: 'multipleCollegeData', label: 'College', icon: '🏫' },
    ];

    const handleTabClick = (tabId) => {
        if (tabId !== 'general' && !isGeneralInfoValid()) {
            toast.error('Please complete all required fields in General Info (except PAN and UAN) before proceeding.');
            return;
        }
        setActiveTab(tabId);
    };

    return (
        <div className="container mx-auto mt-5 px-4 sm:px-6 lg:px-8 max-w-7xl">
            <ToastContainer />
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white text-center py-4">
                    <h4 className="text-xl sm:text-2xl font-bold">Employee Masters</h4>
                </div>
                <div className="p-4 sm:p-6">
                    <ul className="flex flex-wrap border-b border-gray-200">
                        {tabs.map(tab => (
                            <li key={tab.id} className="mr-1">
                                <button
                                    className={`flex items-center py-2 px-3 sm:px-4 text-sm font-medium ${activeTab === tab.id
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : tab.id === 'general' || isGeneralInfoValid()
                                            ? 'text-gray-600 hover:text-blue-600'
                                            : 'text-gray-400 cursor-not-allowed'
                                        }`}
                                    onClick={() => handleTabClick(tab.id)}
                                    disabled={tab.id !== 'general' && !isGeneralInfoValid()}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Employee Code</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.employeeCode}
                                            onChange={(e) => handleInputChange('general', 'employeeCode', e.target.value)}
                                            placeholder="Enter employee code"
                                        />
                                        <span
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 cursor-pointer hover:text-blue-800"
                                            onClick={searchEmployee}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                                        <Select
                                            options={collegeOptions}
                                            value={formData.general.college}
                                            onChange={(option) => handleSelectChange('general', 'college', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Category</label>
                                        <Select
                                            options={categoryOptions}
                                            value={formData.general.employeeCategory}
                                            onChange={(option) => handleSelectChange('general', 'employeeCategory', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                                        <Select
                                            options={typeOptions}
                                            value={formData.general.employeeType}
                                            onChange={(option) => handleSelectChange('general', 'employeeType', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.empName}
                                            onChange={(e) => handleInputChange('general', 'empName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.fatherName}
                                            onChange={(e) => handleInputChange('general', 'fatherName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.dob}
                                            onChange={(e) => handleInputChange('general', 'dob', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                                        <input
                                            type="date"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.doj}
                                            onChange={(e) => handleInputChange('general', 'doj', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.dept}
                                            onChange={(e) => handleInputChange('general', 'dept', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.desgn}
                                            onChange={(e) => handleInputChange('general', 'desgn', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.phoneNo}
                                            onChange={(e) => handleInputChange('general', 'phoneNo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.aadharNo}
                                            onChange={(e) => handleInputChange('general', 'aadharNo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pan Number</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.panNo}
                                            onChange={(e) => handleInputChange('general', 'panNo', e.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Uan Number</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.general.uanNo}
                                            onChange={(e) => handleInputChange('general', 'uanNo', e.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                                        <Select
                                            options={reportOptions}
                                            value={formData.general.report}
                                            onChange={(option) => handleSelectChange('general', 'report', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3 text-center">
                                        <button
                                            type="button"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            onClick={saveGeneralInfo}
                                        >
                                            Save General Info
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                                        <Select
                                            options={maritalStatusOptions}
                                            value={formData.personal.maritalStatus}
                                            onChange={(option) => handleSelectChange('personal', 'maritalStatus', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                                        <Select
                                            options={religionOptions}
                                            value={formData.personal.religion}
                                            onChange={(option) => handleSelectChange('personal', 'religion', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                        <Select
                                            options={bloodGroupOptions}
                                            value={formData.personal.bloodGroup}
                                            onChange={(option) => handleSelectChange('personal', 'bloodGroup', option)}
                                            className="w-full"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Anniversary Date</label>
                                        <input
                                            type="date"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.personal.anniversaryDate}
                                            onChange={(e) => handleInputChange('personal', 'anniversaryDate', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={savePersonalInfo}
                                    >
                                        Save Personal Info
                                    </button>
                                </div>
                                <h5 className="text-lg font-semibold">Family Members & Nominees</h5>
                                {formData.personal.familyMembers.map((member, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Member Name</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={member.memberName}
                                                onChange={(e) => handleInputChange('personal.familyMembers', 'memberName', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                                            <input
                                                type="date"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={member.birthDate}
                                                onChange={(e) => handleInputChange('personal.familyMembers', 'birthDate', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={member.relation}
                                                onChange={(e) => handleInputChange('personal.familyMembers', 'relation', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Percent</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={member.percent}
                                                onChange={(e) => handleInputChange('personal.familyMembers', 'percent', e.target.value, index)}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Is Nominee</label>
                                                <Select
                                                    options={nomineeOptions}
                                                    value={member.isNominee}
                                                    onChange={(option) => handleSelectChange('personal.familyMembers', 'isNominee', option, index)}
                                                    className="w-full"
                                                    classNamePrefix="react-select"
                                                />
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={() => removeRow('personal.familyMembers', index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => addRow('personal.familyMembers')}
                                >
                                    Add Family Member
                                </button>
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={saveFamilyMembers}
                                    >
                                        Save Family Members & Nominees
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'education' && (
                            <div className="space-y-6">
                                <h5 className="text-lg font-semibold">Education Details</h5>
                                {formData.education.map((edu, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={edu.course}
                                                onChange={(e) => handleInputChange('education', 'course', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Institute/Board</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={edu.institute}
                                                onChange={(e) => handleInputChange('education', 'institute', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Passing Year</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={edu.passingYear}
                                                onChange={(e) => handleInputChange('education', 'passingYear', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stream/Subject</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={edu.stream}
                                                onChange={(e) => handleInputChange('education', 'stream', e.target.value, index)}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                                <input
                                                    type="text"
                                                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={edu.specialization}
                                                    onChange={(e) => handleInputChange('education', 'specialization', e.target.value, index)}
                                                />
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={() => removeRow('education', index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => addRow('education')}
                                >
                                    Add Education
                                </button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => toast.info('Save Education not implemented')}
                                    >
                                        Save Education
                                    </button>
                                </div>
                                <h5 className="text-lg font-semibold mt-4">Experience Details</h5>
                                {formData.experience.map((exp, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={exp.companyName}
                                                onChange={(e) => handleInputChange('experience', 'companyName', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={exp.expDesignation}
                                                onChange={(e) => handleInputChange('experience', 'expDesignation', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={exp.period}
                                                onChange={(e) => handleInputChange('experience', 'period', e.target.value, index)}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact No</label>
                                                <input
                                                    type="text"
                                                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={exp.expContactNo}
                                                    onChange={(e) => handleInputChange('experience', 'expContactNo', e.target.value, index)}
                                                />
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={() => removeRow('experience', index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => addRow('experience')}
                                >
                                    Add Experience
                                </button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={saveExperience}
                                    >
                                        Save Experience
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-6">
                                <h5 className="text-lg font-semibold">Permanent Address</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">House No</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.permHouseNo}
                                            onChange={(e) => handleInputChange('contact', 'permHouseNo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.permLocality}
                                            onChange={(e) => handleInputChange('contact', 'permLocality', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.permArea}
                                            onChange={(e) => handleInputChange('contact', 'permArea', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.permDistrict}
                                            onChange={(e) => handleInputChange('contact', 'permDistrict', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.permState}
                                            onChange={(e) => handleInputChange('contact', 'permState', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.permPincode}
                                            onChange={(e) => handleInputChange('contact', 'permPincode', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <h5 className="text-lg font-semibold mt-4">Correspondence Address</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">House No</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.corrHouseNo}
                                            onChange={(e) => handleInputChange('contact', 'corrHouseNo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.corrLocality}
                                            onChange={(e) => handleInputChange('contact', 'corrLocality', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.corrArea}
                                            onChange={(e) => handleInputChange('contact', 'corrArea', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.corrDistrict}
                                            onChange={(e) => handleInputChange('contact', 'corrDistrict', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.corrState}
                                            onChange={(e) => handleInputChange('contact', 'corrState', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.corrPincode}
                                            onChange={(e) => handleInputChange('contact', 'corrPincode', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                                        <input
                                            type="email"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.officialEmail}
                                            onChange={(e) => handleInputChange('contact', 'officialEmail', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
                                        <input
                                            type="email"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.personalEmail}
                                            onChange={(e) => handleInputChange('contact', 'personalEmail', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact No</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.contact.emergencyContact}
                                            onChange={(e) => handleInputChange('contact', 'emergencyContact', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => toast.info('Save Contact not implemented')}
                                    >
                                        Save Contact Info
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <h5 className="text-lg font-semibold">Address Proof</h5>
                                {formData.documents.addressProofs.map((proof, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proof Type</label>
                                            <Select
                                                options={addressProofOptions}
                                                value={proof.proofType}
                                                onChange={(option) => handleSelectChange('documents.addressProofs', 'proofType', option, index)}
                                                className="w-full"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ref No</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={proof.refNo}
                                                onChange={(e) => handleInputChange('documents.addressProofs', 'refNo', e.target.value, index)}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                                                <input
                                                    type="file"
                                                    className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange('documents.addressProofs', index, e)}
                                                />
                                                {proof.preview && <img src={proof.preview} alt="Preview" className="mt-2 max-w-full h-auto rounded-md" />}
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={() => removeRow('documents.addressProofs', index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => addRow('documents.addressProofs')}
                                >
                                    Add Address Proof
                                </button>
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => toast.info('Save Address Proof not implemented')}
                                    >
                                        Save Address Proof
                                    </button>
                                </div>
                                <h5 className="text-lg font-semibold mt-4">ID Proof</h5>
                                {formData.documents.idProofs.map((proof, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proof Type</label>
                                            <Select
                                                options={idProofOptions}
                                                value={proof.proofType}
                                                onChange={(option) => handleSelectChange('documents.idProofs', 'proofType', option, index)}
                                                className="w-full"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ref No</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={proof.refNo}
                                                onChange={(e) => handleInputChange('documents.idProofs', 'refNo', e.target.value, index)}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                                                <input
                                                    type="file"
                                                    className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange('documents.idProofs', index, e)}
                                                />
                                                {proof.preview && <img src={proof.preview} alt="Preview" className="mt-2 max-w-full h-auto rounded-md" />}
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={() => removeRow('documents.idProofs', index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => addRow('documents.idProofs')}
                                >
                                    Add ID Proof
                                </button>
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => toast.info('Save ID Proof not implemented')}
                                    >
                                        Save ID Proof
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bank' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.bank.accountNo}
                                            onChange={(e) => handleInputChange('bank', 'accountNo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.bank.ifsc}
                                            onChange={(e) => handleInputChange('bank', 'ifsc', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                        <input
                                            type="text"
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.bank.branch}
                                            onChange={(e) => handleInputChange('bank', 'branch', e.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                        <textarea
                                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.bank.bankAddress}
                                            onChange={(e) => handleInputChange('bank', 'bankAddress', e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => toast.info('Save Bank Details not implemented')}
                                    >
                                        Save Bank Details
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'insurance' && (
                            <div className="space-y-6">
                                {formData.insurance.map((ins, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Type</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={ins.insuranceType}
                                                onChange={(e) => handleInputChange('insurance', 'insuranceType', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Policy No</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={ins.policyNo}
                                                onChange={(e) => handleInputChange('insurance', 'policyNo', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ref No</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={ins.insuranceRefNo}
                                                onChange={(e) => handleInputChange('insurance', 'insuranceRefNo', e.target.value, index)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Premium</label>
                                            <input
                                                type="text"
                                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={ins.premium}
                                                onChange={(e) => handleInputChange('insurance', 'premium', e.target.value, index)}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Premium Frequency</label>
                                                <Select
                                                    options={premiumFrequencyOptions}
                                                    value={ins.premiumFrequency}
                                                    onChange={(option) => handleSelectChange('insurance', 'premiumFrequency', option, index)}
                                                    className="w-full"
                                                    classNamePrefix="react-select"
                                                />
                                            </div>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={() => removeRow('insurance', index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => addRow('insurance')}
                                >
                                    Add Insurance
                                </button>
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={() => toast.info('Save Insurance not implemented')}
                                    >
                                        Save Insurance
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'multipleCollegeData' && (
                            <div className="space-y-6">
                                <h5 className="text-lg font-semibold">Set Multiple College</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border p-2 text-sm font-medium text-gray-700">Select</th>
                                                <th className="border p-2 text-sm font-medium text-gray-700">College Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.colleges.map((college, index) => (
                                                <tr key={index}>
                                                    <td className="border p-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={college.selected || false}
                                                            onChange={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    colleges: prev.colleges.map((c, i) =>
                                                                        i === index ? { ...c, selected: !c.selected } : c
                                                                    ),
                                                                }));
                                                            }}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="border p-2 text-sm">{college.label}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeMaster;