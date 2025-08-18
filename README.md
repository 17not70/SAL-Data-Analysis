# SAL-Data-Analysis
⚙️ Integration Checklist: Connecting the Pieces

This checklist is the blueprint for a seamless deployment. Each step is a bridge between the different parts of your application.

1. Frontend to Google Cloud Storage (File Upload)

[ ] Action: Update the LandingPage component's handleUpload function.

What it does: Instead of simulating an upload, this code will use the Google Cloud Storage API to securely upload the user's .xlsx file directly to your designated raw data bucket. This is the first link in our chain.

2. Frontend to Firebase Authentication & Firestore (User Data)

[ ] Action: Update the LandingPage's handleUserSignIn function.

What it does: This code will use Firebase Authentication to sign the user in with Google. It will then save their name and email to a Firestore database. This ensures only authorized users can access the system.

3. Frontend Polling for Job Status (Real-time Updates)

[ ] Action: Add new code to the LandingPage to poll Firestore.

What it does: Once the file is uploaded, the frontend will continuously check a specific Firestore document to see if the Spark job is complete. This is how the "Processing..." message will know when to change to "Normalization Complete!".

4. Frontend to Google Cloud Storage (Data Display)

[ ] Action: Update the DashboardPage component's data-fetching logic.

What it does: The dashboard will no longer use mock data. It will read the GCS file path from Firestore and use the Google Cloud Storage API to fetch the processed CSV data, making your charts and tables display real, up-to-date information.

This plan ensures every piece of our code is connected and working together. Once we complete this checklist, you'll have a fully integrated and deployable application.

