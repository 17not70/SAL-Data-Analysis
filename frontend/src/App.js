// -- RMK: Main application router, refactored to use page components. Version 1.2
// -- FILE: frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { format, getWeek, getMonth, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Import our new page component
import LandingPage from './pages/LandingPage.js';

// Import our custom UI components
import { Card, CardHeader, CardTitle, CardContent } from './components/Card.js';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './components/Table.js';

// Import only the Firebase services needed by this file
import { auth, onAuthStateChanged, db, signInWithCustomToken, collection, onSnapshot } from './services/firebase.js';

// Helper function to format numbers with commas and two decimal places
const formatNumber = (num) => {
  if (num === null || isNaN(num)) {
    return '0.00';
  }
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function to handle date parsing
const parseDateString = (dateStr) => {
  const parts = dateStr.split('-');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
  return new Date(2025, month, parseInt(parts[0]));
};

const DashboardPage = ({ onNavigateToLanding }) => {
  // This component's code is still here for now. We will move it in the next step.
  const [data, setData] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedAgencies, setSelectedAgencies] = useState(['All']);
  const [currency, setCurrency] = useState('USD');
  const [viewType, setViewType] = useState('monthly');
  const [totalSalesUsd, setTotalSalesUsd] = useState(0);
  const [totalSalesNpr, setTotalSalesNpr] = useState(0);
  const [totalPaxUsd, setTotalPaxUsd] = useState(0);
  const [totalPaxNpr, setTotalPaxNpr] = useState(0);
  const [agenciesCount, setAgenciesCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const processedFilesRef = collection(db, 'users', userId, 'processed_files');
      
      onSnapshot(processedFilesRef, async (snapshot) => {
        if (!snapshot.empty) {
          const latestDoc = snapshot.docs.find(doc => doc.data().status === 'completed');
          if (latestDoc) {
            const data = latestDoc.data();
            const gcsPath = data.gcsPath;
            setDownloadUrl(gcsPath);

            const response = await fetch(gcsPath);
            const csvText = await response.text();
            
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');
            const parsedData = lines.slice(1).map(line => {
                const values = line.split(',');
                const item = {};
                headers.forEach((header, index) => {
                    item[header.trim()] = values[index];
                });
                return item;
            });
            setData(parsedData);
          }
        }
      });
    };
    
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    if (initialAuthToken) {
        signInWithCustomToken(auth, initialAuthToken).then(() => {
            fetchAndProcessData();
        }).catch(e => console.error("Error signing in", e));
    }
  }, []);

  useEffect(() => {
    const filteredData = data.filter(item => {
      const itemMonth = item.date.split('-')[1];
      const monthMatch = selectedMonth === 'All' || itemMonth.toLowerCase() === selectedMonth.toLowerCase();
      const agencyMatch = selectedAgencies.length === 0 || selectedAgencies[0] === 'All' || selectedAgencies.includes(item.agency);
      return monthMatch && agencyMatch;
    });

    const salesUsd = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.sales_usd) || 0), 0);
    const salesNpr = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.sales_npr) || 0), 0);
    const paxUsd = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.pax_usd) || 0), 0);
    const paxNpr = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.pax_npr) || 0), 0);
    const uniqueAgencies = [...new Set(filteredData.map(item => item.agency))];
    
    setTotalSalesUsd(salesUsd);
    setTotalSalesNpr(salesNpr);
    setTotalPaxUsd(paxUsd);
    setTotalPaxNpr(paxNpr);
    setAgenciesCount(uniqueAgencies.length);

    let groupedData = {};
    filteredData.forEach(item => {
      const itemDate = parseDateString(item.date);
      let key = '';
      let sortableKey = '';

      if (viewType === 'monthly') {
        key = format(itemDate, 'MMM');
        sortableKey = getMonth(itemDate);
      } else if (viewType === 'weekly') {
        const weekNumber = getWeek(itemDate, { weekStartsOn: 1 });
        const monthNumber = getMonth(itemDate);
        key = `Wk ${weekNumber} (${format(itemDate, 'MMM')})`;
        sortableKey = `${monthNumber}-${weekNumber}`;
      } else {
        key = format(itemDate, 'dd-MMM');
        sortableKey = itemDate.getTime();
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { name: key, sortableKey: sortableKey, pax_usd: 0, pax_npr: 0, sales_usd: 0, sales_npr: 0 };
      }
      groupedData[key].pax_usd += parseFloat(item.pax_usd) || 0;
      groupedData[key].pax_npr += parseFloat(item.pax_npr) || 0;
      groupedData[key].sales_usd += parseFloat(item.sales_usd) || 0;
      groupedData[key].sales_npr += parseFloat(item.sales_npr) || 0;
    });

    const sortedGroupedData = Object.values(groupedData).sort((a, b) => a.sortableKey - b.sortableKey);
    setChartData(sortedGroupedData);
    setTableData(filteredData);
    
    const processedForecastData = sortedGroupedData.map(item => ({
      ...item,
      'Forecasted Sales usd': item.sales_usd * 1.05 + (Math.random() * item.sales_usd * 0.1),
      'Forecasted Sales npr': item.sales_npr * 1.05 + (Math.random() * item.sales_npr * 0.1),
    }));
    setForecastData(processedForecastData);
  }, [data, selectedMonth, selectedAgencies, currency, viewType]);

  const MultiSelect = ({ options, onSelectedChange, selected, placeholder }) => {
    return (
      <select multiple value={selected} onChange={(e) => {
        const newSelection = Array.from(e.target.selectedOptions, option => option.value);
        onSelectedChange(newSelection.includes('All') ? ['All'] : newSelection.filter(agency => agency !== 'All'));
      }} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
        <option value="All">All Agencies</option>
        {options.filter(o => o.value !== 'All').map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
      </select>
    );
  };
  
  const agencyOptions = Array.from(new Set(data.map(item => item.agency))).map(agency => ({ label: agency, value: agency }));
  
  // ... The rest of DashboardPage's render logic, etc. remains here for now ...
};

const App = () => {
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ isAuthenticated: !!user, user });
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleViewReport = () => setCurrentPage('dashboard');
  const handleNavigateToLanding = () => setCurrentPage('landing');

  switch (currentPage) {
    case 'landing':
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    case 'dashboard':
      return authState.isAuthenticated ? <DashboardPage onNavigateToLanding={handleNavigateToLanding} /> : <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    default:
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
  }
};

export default App;
