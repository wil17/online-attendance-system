import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Eye,
  EyeOff,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  AlertCircle,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const EmployeeManagement = ({ darkMode, user }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form state for add/edit employee
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee',
    employeeId: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    address: '',
    emergencyContact: '',
    birthDate: '',
    gender: 'male'
  });

  const departments = [
    'Information Technology',
    'Human Resources', 
    'Finance',
    'Marketing',
    'Operations',
    'Sales'
  ];

  const roles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr', label: 'HR' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: 'employee',
      employeeId: '',
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      position: '',
      hireDate: '',
      salary: '',
      address: '',
      emergencyContact: '',
      birthDate: '',
      gender: 'male'
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // First create user account
      const userResponse = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      // Then create employee profile
      const employeeResponse = await api.post('/employees', {
        userId: userResponse.data.user.id,
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        hireDate: formData.hireDate,
        salary: formData.salary,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        birthDate: formData.birthDate,
        gender: formData.gender
      });

      alert('Employee added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Failed to add employee:', error);
      alert('Failed to add employee: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      email: employee.email || '',
      password: '',
      role: employee.role || 'employee',
      employeeId: employee.employee_id || '',
      firstName: employee.first_name || '',
      lastName: employee.last_name || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      hireDate: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      salary: employee.salary || '',
      address: employee.address || '',
      emergencyContact: employee.emergency_contact || '',
      birthDate: employee.birth_date ? employee.birth_date.split('T')[0] : '',
      gender: employee.gender || 'male'
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      await api.put(`/employees/${selectedEmployee.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        hireDate: formData.hireDate,
        salary: formData.salary,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        birthDate: formData.birthDate,
        gender: formData.gender
      });

      alert('Employee updated successfully!');
      setShowEditModal(false);
      resetForm();
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to update employee:', error);
      alert('Failed to update employee: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      await api.delete(`/employees/${employeeId}`);
      alert('Employee deleted successfully!');
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-yellow-500';
      case 'terminated': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access employee management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Employee Management</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage company employees and their information
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <div className="flex space-x-2">
            <button className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}>
              <Filter className="h-5 w-5" />
            </button>
            <button className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}>
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading employees...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-12">
            <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-red-500">{error}</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center p-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Employees Found</h3>
            <p className="text-gray-500">No employees match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {employee.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{employee.email}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {employee.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{employee.department}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {employee.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBg(employee.status || 'active')}`}>
                        {employee.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add New Employee</h2>
                <button
                  onClick={() => {setShowAddModal(false); resetForm();}}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="EMP001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="employee@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Position</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {setShowAddModal(false); resetForm();}}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Add Employee</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;