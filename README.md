### SAL Data Analysis Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_SITE_NAME/deploys)

A full-stack web application designed for analyzing sales data. Users can upload an Excel file (`.xlsx`), which is then processed by a serverless backend and a PySpark job. The normalized data is presented in a rich, interactive dashboard with charts, key metrics, and filterable tables.

**Live Demo:** [**https://gsda-sa.netlify.app/**](https://gsda-sa.netlify.app/)

---

## 🚀 Key Features

* **Secure User Sign-In:** A simple and effective sign-in flow to access the platform.
* **Excel File Upload:** Intuitive drag-and-drop or file selection for `.xlsx` sales reports.
* **Real-time Progress Tracking:** Visual feedback for file upload and backend processing status.
* **Serverless Processing:** A Google Cloud Function triggers a PySpark job to normalize the uploaded data.
* **Interactive Dashboard:** A rich data visualization dashboard built with Recharts, featuring:
    * Key performance indicators (KPIs).
    * Dynamic charts for sales and pax analysis.
    * Data filtering by month and agency.
    * A detailed, sortable transaction table.

---

## 🛠️ Tech Stack

* **Frontend:**
    * [React](https://reactjs.org/) (UI Library)
    * [Tailwind CSS](https://tailwindcss.com/) (Styling)
    * [Recharts](https://recharts.org/) (Charting)
    * [date-fns](https://date-fns.org/) (Date Utilities)
    * [Lucide React](https://lucide.dev/) (Icons)
* **Backend & Services:**
    * [Google Cloud Functions](https://cloud.google.com/functions) (Serverless Backend - Python)
    * [Google Firebase](https://firebase.google.com/) (Authentication, Firestore Database)
    * [Google Cloud Storage](https://cloud.google.com/storage) (File Storage)
* **Data Processing:**
    * [Apache Spark (PySpark)](https://spark.apache.org/docs/latest/api/python/)
* **Deployment:**
    * [Netlify](https://www.netlify.com/) (Frontend Hosting & Continuous Deployment)

---

## 📂 Project Structure

This project is a monorepo containing three distinct parts: the frontend application, the serverless cloud functions, and the data processing jobs.

```

.
├── cloud\_functions/        \# Serverless backend (Python)
│   ├── main.py
│   └── requirements.txt
├── frontend/               \# React web application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     \# Reusable UI components
│   │   │   ├── Card.js
│   │   │   └── Table.js
│   │   ├── pages/          \# Page-level components
│   │   │   ├── DashboardPage.js
│   │   │   └── LandingPage.js
│   │   ├── services/       \# Firebase service configuration
│   │   │   └── firebase.js
│   │   ├── App.js          \# Main application router
│   │   └── index.js        \# React entry point
│   └── package.json
├── spark\_jobs/             \# PySpark data normalization scripts
│   └── normalize\_data.py
└── README.md

````

---

## 📑 File Contents & Code

Here is the code for each key file in the project.

### Frontend (`frontend/src/`)

<details>
<summary><code><b>frontend/src/App.js</b></code></summary>

```javascript
// -- RMK: Main application router. Cleaned and finalized. Version 2.0
// -- FILE: frontend/src/App.js

import React, { useState, useEffect } from 'react';

// Import our page components
import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';

// Import only the Firebase services needed for authentication state
import { auth, onAuthStateChanged } from './services/firebase.js';

const App = () => {
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });
  const [currentPage, setCurrentPage] = useState('landing');

  // Listen for authentication changes and update the state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ isAuthenticated: !!user, user });
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleViewReport = () => setCurrentPage('dashboard');
  const handleNavigateToLanding = () => setCurrentPage('landing');

  // The main router logic
  switch (currentPage) {
    case 'dashboard':
      // Show dashboard only if authenticated, otherwise show landing page
      return authState.isAuthenticated 
        ? <DashboardPage onNavigateToLanding={handleNavigateToLanding} /> 
        : <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    case 'landing':
    default:
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
  }
};

export default App;
````

\</details\>

\<details\>
\<summary\>\<code\>\<b\>frontend/src/index.js\</b\>\</code\>\</summary\>

```javascript
// -- RMK: React application entry point. Version 1.0
// -- FILE: frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
// Assuming you have a global CSS file for base styles (like Tailwind imports)
// import './index.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

\</details\>

\<details\>
\<summary\>\<code\>\<b\>frontend/src/services/firebase.js\</b\>\</code\>\</summary\>

```javascript
// -- RMK: Centralized Firebase configuration and services. Version 1.0
// -- FILE: frontend/src/services/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// -- REMARK: Firebase configuration. This will be automatically provided by the environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Firebase functions to be used in other files
export {
  signInWithCustomToken,
  onAuthStateChanged,
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  setDoc,
  ref,
  uploadBytesResumable,
  getDownloadURL
};
```

\</details\>

\<details\>
\<summary\>\<code\>\<b\>frontend/src/pages/LandingPage.js\</b\>\</code\>\</summary\>

```javascript
// -- RMK: The main landing page for user sign-in and file upload. Version 1.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, CheckCircle, Loader } from 'lucide-react';
import { auth, db, storage, signInWithCustomToken, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable } from '../services/firebase.js';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  // ... (Component state and logic for Landing Page) ...
  // This file contains all the state and JSX for the sign-in and upload flow.
};

export default LandingPage;
```

\</details\>

\<details\>
\<summary\>\<code\>\<b\>frontend/src/pages/DashboardPage.js\</b\>\</code\>\</summary\>

```javascript
// -- RMK: The main dashboard for data visualization. Version 1.0
// -- FILE: frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useMemo } from 'react';
// ... (All necessary imports for dashboard) ...

const DashboardPage = ({ onNavigateToLanding }) => {
  // ... (Component state and logic for the Dashboard) ...
  // This file contains all the data fetching, filtering, and rendering logic for the charts and tables.
};

export default DashboardPage;
```

\</details\>

\<details\>
\<summary\>\<code\>\<b\>frontend/src/components/Card.js\</b\>\</code\>\</summary\>

```javascript
// -- RMK: Reusable Card components for consistent styling. Version 1.0
// -- FILE: frontend/src/components/Card.js

import React from 'react';

// Custom Card components for consistent styling
export const Card = ({ children, className = '' }) => (
  // ... JSX for Card ...
);

export const CardHeader = ({ children, className = '' }) => (
  // ... JSX for CardHeader ...
);

export const CardTitle = ({ children, className = '' }) => (
  // ... JSX for CardTitle ...
);

export const CardContent = ({ children, className = '' }) => (
  // ... JSX for CardContent ...
);
```

\</details\>

\<details\>
\<summary\>\<code\>\<b\>frontend/src/components/Table.js\</b\>\</code\>\</summary\>

```javascript
// -- RMK: Reusable Table components with corrected HTML structure. Version 1.0
// -- FILE: frontend/src/components/Table.js

import React from 'react';

// Custom Table components for consistent styling
export const Table = ({ children }) => (
  // ... JSX for Table ...
);

// ... (All other table components: TableHeader, TableBody, etc.) ...
```

\</details\>

### Cloud Functions (`cloud_functions/`)

\<details\>
\<summary\>\<code\>\<b\>cloud\_functions/main.py\</b\>\</code\> (Illustrative)\</summary\>

```python
# -- RMK: Google Cloud Function to trigger on file upload. Version 1.0
# -- FILE: cloud_functions/main.py

import functions_framework
from google.cloud import firestore
import google.cloud.logging

# Initialize Firestore client
db = firestore.Client()

@functions_framework.cloud_event
def process_uploaded_file(cloud_event):
    """
    This function is triggered when a file is uploaded to Google Cloud Storage.
    It logs the event and updates Firestore to indicate processing has begun.
    """
    data = cloud_event.data
    bucket = data["bucket"]
    name = data["name"]

    print(f"File {name} uploaded to bucket {bucket}.")
    
    # In a real application, you would trigger the Spark job from here,
    # for example, by submitting a job to a Dataproc cluster.
    
    # Update Firestore to reflect the status
    # This is a simplified example
    file_id = name.split('.')[0] # Assuming file name is the doc ID
    doc_ref = db.collection('processed_files').document(file_id)
    doc_ref.update({
        'status': 'processing',
        'gcsPath': f'gs://{bucket}/{name}'
    })

    print(f"Firestore status for {file_id} updated to 'processing'.")

```

\</details\>

### Spark Jobs (`spark_jobs/`)

\<details\>
\<summary\>\<code\>\<b\>spark\_jobs/normalize\_data.py\</b\>\</code\> (Illustrative)\</summary\>

```python
# -- RMK: PySpark job to normalize sales data from Excel. Version 1.0
# -- FILE: spark_jobs/normalize_data.py

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date, lower

def main():
    """
    Main Spark job to read an Excel file, normalize the data,
    and write it back to storage as a CSV.
    """
    # Initialize Spark Session
    spark = SparkSession.builder.appName("SalesDataNormalization").getOrCreate()

    # In a real job, these paths would be passed as arguments
    input_path = "gs://YOUR_BUCKET/raw-data-uploads/sales_report.xlsx"
    output_path = "gs://YOUR_BUCKET/processed-data/normalized_sales.csv"
    
    # Read the Excel file
    # Note: Requires the com.crealytics:spark-excel library
    df = spark.read.format("com.crealytics.spark.excel") \
        .option("header", "true") \
        .load(input_path)

    # Perform transformations (example)
    normalized_df = df.withColumn("normalized_date", to_date(col("Date"), "yyyy-MM-dd")) \
                      .withColumn("agency_lower", lower(col("Agency"))) \
                      .drop("Date", "Agency")

    # Write the result as a single CSV file
    normalized_df.coalesce(1).write.mode("overwrite").option("header", "true").csv(output_path)
    
    print(f"Successfully processed {input_path} and saved to {output_path}")

    spark.stop()

if __name__ == "__main__":
    main()
```

\</details\>

-----

## ⚙️ Setup and Local Installation

To run this project on your local machine:

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
    cd YOUR_REPO_NAME
    ```

2.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Set up Firebase:**

      * Create a project on [Firebase](https://firebase.google.com/).
      * Create a Web App and get your `firebaseConfig` object.
      * Enable Firestore, Authentication, and Storage.
      * You will need to configure how the `__firebase_config` variable is provided to the app (e.g., via a `.env` file and Webpack).

5.  **Run the application:**

    ```bash
    npm start
    ```

    The application will be available at `http://localhost:3000`.

<!-- end list -->

```
```
