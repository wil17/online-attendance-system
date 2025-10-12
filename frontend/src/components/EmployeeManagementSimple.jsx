import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Configuration (sama seperti di AttendanceApp.jsx)
const API_BASE = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const EmployeeManagementSimple = ({ darkMode, user }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

const fetchEmployees = async () => {
  try {
    setLoading(true);
    // Test dengan raw endpoint dulu
    const response = await api.get('/employees/raw');
    setEmployees(response.data.employees || []);
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    setError('Failed to fetch employees: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};
    // Fallback data dummy jika masih error
    const dummyEmployees = [
      {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
        employee_id: 'ADM001',
        department: 'Administration',
        position: 'System Administrator',
        status: 'active'
      },
      {
        id: 2,
        first_name: 'John',
        last_name: 'Doe',
        employee_id: 'EMP001',
        department: 'IT',
        position: 'Developer',
        status: 'active'
      }
    ];
    
    setEmployees(dummyEmployees);
    setError('Using demo data - Backend not available');
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <div className={`text-center p-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading employees...</div>;
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-lg p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <button 
            onClick={fetchEmployees}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-lg p-6`}>
      <h2 className="text-xl font-bold mb-4">Employee Management</h2>
      
      {employees.length === 0 ? (
        <div className="text-center py-8">
          <p>No employees found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Position</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-2">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="px-4 py-2">{employee.employee_id}</td>
                  <td className="px-4 py-2">{employee.department}</td>
                  <td className="px-4 py-2">{employee.position}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : employee.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagementSimple;