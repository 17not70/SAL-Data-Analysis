// -- RMK: The main dashboard for data visualization. Version 1.0
// -- FILE: frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { format, getWeek, getMonth, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '../components/Card.js';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '../components/Table.js';
import { auth, db, signInWithCustomToken, collection, onSnapshot } from '../services/firebase.js';

// Helper function to format numbers with commas and two decimal places
const formatNumber = (num) => {
  if (num === null || isNaN(num)) {
    return '0.00';
  }
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper function to handle date parsing
const parseDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames.findIndex(m => m.toLowerCase() === parts[1]?.toLowerCase());
  return new Date(2025, month, parseInt(parts[0]));
};

const DashboardPage = ({ onNavigateToLanding }) => {
  const [data, setData] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedAgencies, setSelectedAgencies] = useState(['All']);
  const [currency, setCurrency] = useState('USD');
  const [viewType, setViewType] = useState('monthly');

  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const processedFilesRef = collection(db, 'users', userId, 'processed_files');
      
      const unsubscribe = onSnapshot(processedFilesRef, async (snapshot) => {
        if (!snapshot.empty) {
          const latestDoc = snapshot.docs.find(doc => doc.data().status === 'completed');
          if (latestDoc) {
            const docData = latestDoc.data();
            const gcsPath = docData.gcsPath;
            setDownloadUrl(gcsPath);

            try {
              const response = await fetch(gcsPath);
              const csvText = await response.text();
              const lines = csvText.trim().split('\n');
              const headers = lines[0].split(',').map(h => h.trim());
              const parsedData = lines.slice(1).map(line => {
                  const values = line.split(',');
                  const item = {};
                  headers.forEach((header, index) => {
                      item[header] = values[index];
                  });
                  return item;
              });
              setData(parsedData);
            } catch (error) {
              console.error("Error fetching or parsing CSV data:", error);
            }
          }
        }
      });
      return unsubscribe; // Return the unsubscribe function for cleanup
    };
    
    // Authenticate and then fetch data
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    if (initialAuthToken && !auth.currentUser) {
        signInWithCustomToken(auth, initialAuthToken)
          .then(() => fetchAndProcessData())
          .catch(e => console.error("Error signing in", e));
    } else if (auth.currentUser) {
        fetchAndProcessData();
    }
  }, []);

  const filteredData = useMemo(() => data.filter(item => {
    if (!item.date) return false;
    const itemMonth = item.date.split('-')[1];
    const monthMatch = selectedMonth === 'All' || itemMonth?.toLowerCase() === selectedMonth.toLowerCase();
    const agencyMatch = selectedAgencies[0] === 'All' || selectedAgencies.includes(item.agency);
    return monthMatch && agencyMatch;
  }), [data, selectedMonth, selectedAgencies]);

  const analytics = useMemo(() => {
    const salesUsd = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.sales_usd) || 0), 0);
    const salesNpr = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.sales_npr) || 0), 0);
    const paxUsd = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.pax_usd) || 0), 0);
    const paxNpr = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.pax_npr) || 0), 0);
    const uniqueAgencies = [...new Set(filteredData.map(item => item.agency))];
    
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
        key = `Wk ${weekNumber} (${format(itemDate, 'MMM')})`;
        sortableKey = getMonth(itemDate) * 100 + weekNumber;
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

    const chartData = Object.values(groupedData).sort((a, b) => a.sortableKey - b.sortableKey);
    const forecastData = chartData.map(item => ({
      ...item,
      'Forecasted Sales usd': item.sales_usd * 1.05 + (Math.random() * item.sales_usd * 0.1),
    }));

    return { salesUsd, salesNpr, paxUsd, paxNpr, agenciesCount: uniqueAgencies.length, chartData, forecastData };
  }, [filteredData, viewType]);

  const agencyOptions = useMemo(() => Array.from(new Set(data.map(item => item.agency))).map(agency => ({ label: agency, value: agency })), [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatNumber(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 flex flex-col items-center">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 mb-8">
        <h1 className="text-3xl font-extrabold text-center">
          SAL Data Analysis Platform
        </h1>
      </div>
      <div className="container mx-auto p-6 mt-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Sales Dashboard</h2>
          <button onClick={onNavigateToLanding} className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full shadow-lg hover:bg-gray-300 transition-all duration-200">
            <ArrowLeft size={16} className="mr-2" />
            Back to Upload
          </button>
        </div>
        {/* The rest of the JSX for the dashboard... */}
      </div>
    </div>
  );
};

export default DashboardPage;
