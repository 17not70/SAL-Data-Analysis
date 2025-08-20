// -- RMK: frontend/src/App.jsx: Version Final 1.0
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Upload, Download, Eye, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { format, getWeek, getMonth, parseISO } from 'date-fns';

// -- REMARK: Firestore and Firebase imports for production.
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// -- REMARK: Firebase configuration. This will be automatically provided by the environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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

// Custom Card components for consistent styling
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-row items-center justify-between pb-2 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-sm font-medium ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`text-2xl font-bold ${className}`}>
    {children}
  </div>
);

// Custom Table components with corrected HTML structure
const Table = ({ children }) => (
  <div className="w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
);

const TableHeader = ({ children }) => (
  <thead className="sticky top-0 bg-white shadow-sm z-10">{children}</thead>
);

const TableBody = ({ children }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

const TableRow = ({ children, ...props }) => (
  <tr className="border-b transition-colors hover:bg-gray-100" {...props}>{children}</tr>
);

const TableHead = ({ children }) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">{children}</th>
);

const TableCell = ({ children }) => (
  <td className="p-4 align-middle">{children}</td>
);

const TableCaption = ({ children }) => (
  <caption className="mt-4 text-sm text-gray-500">{children}</caption>
);

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [greeting, setGreeting] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial'); // 'initial', 'uploading', 'completed'
  const [processingStatus, setProcessingStatus] = useState('initial'); // 'initial', 'processing', 'completed'
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const handleNameChange = (e) => setUserName(e.target.value);
  const handleEmailChange = (e) => setUserEmail(e.target.value);

  const handleUserSignIn = async (e) => {
    e.preventDefault();
    if (userName && userEmail) {
      // -- REMARK: Real Firebase authentication and Firestore logic
      try {
        await signInWithCustomToken(auth, initialAuthToken);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, {
          name: userName,
          email: userEmail,
          lastSignIn: serverTimestamp(),
        }, { merge: true });
        authState.setIsAuthenticated(true);
      } catch (error) {
        console.error("Error signing in or storing user data:", error);
        alert("Sign-in failed. Please try again.");
      }
    } else {
      alert("Please enter your name and email.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus('initial');
      setProcessingStatus('initial');
    } else {
      setSelectedFile(null);
      alert('Invalid file type. Please upload a .xlsx file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setProcessingStatus('initial');

    // -- REMARK: Real Google Cloud Storage upload logic
    const storageRef = ref(storage, `raw-data-uploads/${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const docRef = await addDoc(collection(userDocRef, 'uploads'), {
      fileName: selectedFile.name,
      status: 'uploading',
      createdAt: serverTimestamp(),
    });

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error("Upload failed", error);
        setUploadStatus('error');
      },
      () => {
        setUploadStatus('completed');
        setProcessingStatus('processing');
        // Update Firestore document with completion status and file path
        setDoc(doc(db, 'processed_files', docRef.id), {
          status: 'processing',
          gcsPath: `gs://${storageRef.bucket}/${storageRef.fullPath}`,
          processedFileName: '',
        }, { merge: true });
      }
    );
  };

  // -- REMARK: Firestore listener for real-time status updates
  useEffect(() => {
    if (processingStatus === 'processing' && authState.isAuthenticated) {
      const q = collection(db, 'users', auth.currentUser.uid, 'uploads');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const doc = change.doc.data();
            if (doc.status === 'completed') {
              setProcessingStatus('completed');
            } else if (doc.status === 'error') {
              setProcessingStatus('error');
            }
          }
        });
      });
      return () => unsubscribe();
    }
  }, [processingStatus, authState.isAuthenticated]);
  
  const handleDownload = () => {
    // -- REMARK: Real download logic would be implemented here
    alert('Placeholder: Initiating download of normalized data.');
  };

  const handleViewReport = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

  const renderProgressCircle = () => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (uploadProgress / 100) * circumference;

    return (
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-gray-300"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50%"
            cy="50%"
          />
          <circle
            className="text-emerald-500 transition-all duration-300 ease-in-out"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50%"
            cy="50%"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
          {Math.round(uploadProgress)}%
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 flex flex-col items-center justify-center text-gray-800">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 mb-8">
        <h1 className="text-3xl font-extrabold text-center">
          SAL Data Analysis Platform
        </h1>
      </div>

      <div className="w-full max-w-lg bg-gray-50 p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center mt-20">
        {!authState.isAuthenticated ? (
          <form onSubmit={handleUserSignIn} className="w-full">
            <h2 className="text-xl font-semibold mb-6 text-center">Please sign in to continue</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                value={userName}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={userEmail}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              Sign In
            </button>
          </form>
        ) : (
          <>
            <p className="text-2xl font-bold text-center mb-6">
              {greeting}, {userName}!
            </p>
            {uploadStatus === 'initial' && processingStatus === 'initial' && (
              <>
                <p className="text-gray-600 mb-6 text-center">
                  Please upload your Excel sales report (.xlsx) to begin data analysis.
                </p>
                <label htmlFor="file-upload" className="cursor-pointer w-full">
                  <div className="flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 transform hover:-translate-y-1">
                    <Upload size={24} className="mr-3" />
                    <span className="text-lg font-semibold">
                      {selectedFile ? selectedFile.name : 'Select File'}
                    </span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <button
                    onClick={handleUpload}
                    className="mt-6 w-full flex items-center justify-center px-8 py-4 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <span className="text-lg font-semibold">Start Upload</span>
                  </button>
                )}
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className="flex flex-col items-center">
                <p className="text-gray-700 mb-6 text-lg font-semibold">Uploading file...</p>
                {renderProgressCircle()}
              </div>
            )}

            {uploadStatus === 'completed' && processingStatus === 'processing' && (
              <div className="flex flex-col items-center">
                <p className="text-emerald-600 font-semibold text-2xl mb-4">
                  <CheckCircle size={32} className="inline-block mr-2" /> Upload Complete!
                </p>
                <p className="text-gray-700 mb-6 text-lg font-semibold">
                  Processing file...
                </p>
                <Loader size={64} className="animate-spin text-indigo-500" />
              </div>
            )}

            {processingStatus === 'completed' && (
              <>
                <p className="text-emerald-600 font-semibold text-2xl mb-4">
                  <CheckCircle size={32} className="inline-block mr-2" /> Normalization Complete!
                </p>
                <p className="text-gray-700 mb-6 text-center">
                  Your data is ready for download or analysis.
                </p>
                <div className="w-full flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-sky-500 text-white rounded-full shadow-lg hover:bg-sky-600 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <Download size={20} className="mr-3" />
                    <span className="text-base font-semibold">Download Normalized Data</span>
                  </button>
                  <button
                    onClick={handleViewReport}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <Eye size={20} className="mr-3" />
                    <span className="text-base font-semibold">View Report</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <footer className="mt-12 text-gray-500 text-sm text-center">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

const DashboardPage = ({ onNavigateToLanding }) => {
  const [data, setData] = useState([]);
  
  // -- REMARK: State to hold the final processed file's URL
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

  // -- REMARK: Data fetching logic
  useEffect(() => {
    // We fetch the latest processed file's path from Firestore
    // then fetch the CSV data from that GCS URL.
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

            // Fetch the CSV data from the GCS URL
            const response = await fetch(gcsPath);
            const csvText = await response.text();
            
            // -- REMARK: This is a simplified CSV parsing. In a real app,
            // a library like 'papaparse' would be used for more robust parsing.
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
    
    // Authenticate and then fetch data
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

    const salesUsd = filteredData.reduce((acc, curr) => acc + curr.sales_usd, 0);
    const salesNpr = filteredData.reduce((acc, curr) => acc + curr.sales_npr, 0);
    const paxUsd = filteredData.reduce((acc, curr) => acc + curr.pax_usd, 0);
    const paxNpr = filteredData.reduce((acc, curr) => acc + curr.pax_npr, 0);
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
        groupedData[key] = {
          name: key,
          sortableKey: sortableKey,
          pax_usd: 0,
          pax_npr: 0,
          sales_usd: 0,
          sales_npr: 0
        };
      }
      groupedData[key].pax_usd += parseFloat(curr.pax_usd);
      groupedData[key].pax_npr += parseFloat(curr.pax_npr);
      groupedData[key].sales_usd += parseFloat(curr.sales_usd);
      groupedData[key].sales_npr += parseFloat(curr.sales_npr);
    });

    const sortedGroupedData = Object.values(groupedData).sort((a, b) => {
        if (a.sortableKey < b.sortableKey) return -1;
        if (a.sortableKey > b.sortableKey) return 1;
        return 0;
    });

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
      <select
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        multiple
        value={selected}
        onChange={(e) => {
          const newSelection = Array.from(e.target.selectedOptions, option => option.value);
          if (newSelection.includes('All')) {
            onSelectedChange(['All']);
          } else {
            onSelectedChange(newSelection.filter(agency => agency !== 'All'));
          }
        }}
      >
        <option value="All">All Agencies</option>
        {options.filter(o => o.value !== 'All').map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  };
  
  const agencyOptions = Array.from(new Set(data.map(item => item.agency))).map(agency => ({ label: agency, value: agency }));
  

  const renderTableData = () => {
    let headers = [];
    let content = [];
    let caption = '';

    if (viewType === 'daily') {
      caption = 'A list of your daily sales transactions.';
      headers = ['Date', 'Agency', 'Pax (USD)', 'Amount (USD)', 'Pax (NPR)', 'Amount (NPR)'];
      content = tableData.map((item, index) => (
        <TableRow key={index}>
          <TableCell>{item.date}</TableCell>
          <TableCell>{item.agency}</TableCell>
          <TableCell>{formatNumber(item.pax_usd)}</TableCell>
          <TableCell>{currency === 'USD' ? formatNumber(item.sales_usd) : formatNumber(item.sales_npr)}</TableCell>
          <TableCell>{formatNumber(item.pax_npr)}</TableCell>
          <TableCell>{currency === 'NPR' ? formatNumber(item.sales_npr) : formatNumber(item.sales_usd)}</TableCell>
        </TableRow>
      ));
    } else {
      caption = `A summary of your sales transactions by ${viewType === 'monthly' ? 'month' : 'week'}.`;
      headers = ['Period', 'Pax (USD)', 'Amount (USD)', 'Pax (NPR)', 'Amount (NPR)'];
      
      const groupedData = tableData.reduce((acc, curr) => {
        const itemDate = parseDateString(curr.date);
        let key = '';
        if (viewType === 'monthly') {
          key = format(itemDate, 'MMMM yyyy');
        } else {
          key = `Week ${getWeek(itemDate, { weekStartsOn: 1 })} of ${format(itemDate, 'MMMM')}`;
        }
        
        if (!acc[key]) {
          acc[key] = { name: key, pax_usd: 0, pax_npr: 0, sales_usd: 0, sales_npr: 0 };
        }
        acc[key].pax_usd += parseFloat(curr.pax_usd);
        acc[key].pax_npr += parseFloat(curr.pax_npr);
        acc[key].sales_usd += parseFloat(curr.sales_usd);
        acc[key].sales_npr += parseFloat(curr.sales_npr);
        return acc;
      }, {});
      
      content = Object.values(groupedData).map((item, index) => (
        <TableRow key={index}>
          <TableCell>{item.name}</TableCell>
          <TableCell>{formatNumber(item.pax_usd)}</TableCell>
          <TableCell>{currency === 'USD' ? formatNumber(item.sales_usd) : formatNumber(item.sales_npr)}</TableCell>
          <TableCell>{formatNumber(item.pax_npr)}</TableCell>
          <TableCell>{currency === 'NPR' ? formatNumber(item.sales_npr) : formatNumber(item.sales_usd)}</TableCell>
        </TableRow>
      ));
    }
    
    return (
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => <TableHead key={index}>{header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {content}
        </TableBody>
      </Table>
    );
  };
  
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
          <button
            onClick={onNavigateToLanding}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full shadow-lg hover:bg-gray-300 transition-all duration-200"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Upload
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <select
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              <option value="Feb">February</option>
              <option value="Mar">March</option>
              <option value="Apr">April</option>
              <option value="May">May</option>
              <option value="Jun">June</option>
              <option value="Jul">July</option>
              <option value="Aug">August</option>
            </select>
            <MultiSelect
              options={agencyOptions}
              onSelectedChange={setSelectedAgencies}
              selected={selectedAgencies}
              placeholder="Select Agencies"
            />
            <button
              onClick={() => setCurrency(currency === 'USD' ? 'NPR' : 'USD')}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
            >
              Toggle Currency: {currency}
            </button>
            <button
              onClick={() => setViewType(viewType === 'monthly' ? 'weekly' : (viewType === 'weekly' ? 'daily' : 'monthly'))}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
            >
              View: {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Sales ({currency})</CardTitle>
            </CardHeader>
            <CardContent>
              <div>{currency === 'USD' ? `$${formatNumber(totalSalesUsd)}` : `NPR ${formatNumber(totalSalesNpr)}`}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Pax ({currency})</CardTitle>
            </CardHeader>
            <CardContent>
              <div>{currency === 'USD' ? formatNumber(totalPaxUsd) : formatNumber(totalPaxNpr)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Sales (Combined)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>${formatNumber(totalSalesUsd)} / NPR {formatNumber(totalSalesNpr)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div>{agenciesCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl shadow-lg mb-8">
          <CardHeader>
            <CardTitle>{viewType.charAt(0).toUpperCase() + viewType.slice(1)} Sales by Pax</CardTitle>
          </CardHeader>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="pax_usd" fill="#8884d8" name="Pax (USD)" />
                <Bar dataKey="pax_npr" fill="#82ca9d" name="Pax (NPR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-xl shadow-lg mb-8">
          <CardHeader>
            <CardTitle>{viewType.charAt(0).toUpperCase() + viewType.slice(1)} Sales Forecast</CardTitle>
          </CardHeader>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="sales_usd" stroke="#8884d8" name="Actual Sales (USD)" />
                <Line type="monotone" dataKey="Forecasted Sales usd" stroke="#82ca9d" name="Forecasted Sales (USD)" dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle>{viewType.charAt(0).toUpperCase() + viewType.slice(1)} Transactions</CardTitle>
          </CardHeader>
          <div className="p-6">
            {renderTableData()}
          </div>
        </Card>
      </div>
    </div>
  );
};
  

const App = () => {
  // We'll use a single state for authentication and page navigation
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });
  const [currentPage, setCurrentPage] = useState('landing');

  // Listen for authentication changes
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState({ isAuthenticated: true, user });
      } else {
        setAuthState({ isAuthenticated: false, user: null });
      }
    });
  }, []);

  const handleViewReport = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToLanding = () => {
    setCurrentPage('landing');
  };

  // The main router logic
  switch (currentPage) {
    case 'landing':
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    case 'dashboard':
      // The dashboard page will only be accessible if the user is authenticated
      if (authState.isAuthenticated) {
        return <DashboardPage onNavigateToLanding={handleNavigateToLanding} authState={authState} />;
      } else {
        return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
      }
    default:
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
  }
};

export default App;
