# -- RMK: cloud_functions/main.py: Version 2.2
import functions_framework
import json
import os
from google.cloud import storage
from google.cloud import dataproc_v1 as dataproc
from google.cloud import firestore

# Initialize clients for Google Cloud services
storage_client = storage.Client()
dataproc_client = dataproc.JobControllerClient(client_options={
    'api_endpoint': 'us-central1-dataproc.googleapis.com:443'
})
firestore_db = firestore.Client()

# -- REMARK: Set these environment variables in your Cloud Function's configuration.
# This ensures that sensitive information and configurations are not hardcoded.
GCS_PROCESSED_BUCKET = os.environ.get('GCS_PROCESSED_BUCKET')
DATAPROC_PROJECT_ID = os.environ.get('DATAPROC_PROJECT_ID')
DATAPROC_REGION = os.environ.get('DATAPROC_REGION')
DATAPROC_CLUSTER_NAME = os.environ.get('DATAPROC_CLUSTER_NAME')
SPARK_JOB_GCS_PATH = os.environ.get('SPARK_JOB_GCS_PATH')
FIRESTORE_COLLECTION = 'processed_files' # Collection to store processed file metadata

@functions_framework.cloud_event
def process_file_event(cloud_event):
    """
    Cloud Function to process a GCS file upload event.
    
    This function is triggered automatically when a new file is uploaded
    to the designated Google Cloud Storage bucket. It checks the file,
    submits a Spark job to Dataproc for normalization, and updates Firestore.

    Args:
        cloud_event (dict): The event payload from Cloud Storage.
    """
    data = cloud_event.data

    # Extract file details from the event payload
    bucket_name = data["bucket"]
    file_name = data["name"]
    input_file_path = f"gs://{bucket_name}/{file_name}"

    print(f"Received file upload event for: {file_name} in bucket: {bucket_name}")

    # Check for valid file name to filter out non-daily report sheets
    # We are looking for sheets named in the format `dd-mmm`.
    # This check prevents processing of summary sheets like "Main Aug-25".
    if "main" in file_name.lower() or not file_name.endswith('.xlsx'):
        print(f"Ignoring non-daily report or non-xlsx file: {file_name}")
        return

    # -- REMARK: Placeholder for getting user information (e.g., from a token in the file metadata).
    # This is where you would retrieve the user email and name that you stored
    # in Firebase during the sign-in step. For this example, we'll use a placeholder.
    user_email = 'ezondiza@gmail.com'
    user_name = 'ezondiza'

    # Construct and submit the Dataproc Spark job
    job_placement = dataproc.JobPlacement(cluster_name=DATAPROC_CLUSTER_NAME)
    
    # The Spark job requires two arguments: the input file path and the output bucket name.
    spark_job = dataproc.SparkJob(
        main_python_file_uri=SPARK_JOB_GCS_PATH,
        file_uris=[SPARK_JOB_GCS_PATH], # This ensures the script is available to the cluster
        args=[input_file_path, GCS_PROCESSED_BUCKET]
    )

    job = dataproc.Job(placement=job_placement, spark_job=spark_job)
    try:
        response = dataproc_client.submit_job_as_operation(
            project_id=DATAPROC_PROJECT_ID,
            region=DATAPROC_REGION,
            job=job
        )
        job_id = response.name
        print(f"Submitted Dataproc job with ID: {job_id}")

        # Create a new document in Firestore to track the job status
        # This document ID can be used by the frontend to poll for status updates.
        doc_ref = firestore_db.collection(FIRESTORE_COLLECTION).document()
        doc_ref.set({
            'user_email': user_email,
            'user_name': user_name,
            'original_file': file_name,
            'job_id': job_id,
            'status': 'processing',
            'created_at': firestore.SERVER_TIMESTAMP
        })
        print(f"Created Firestore document with ID: {doc_ref.id} to track job.")

    except Exception as e:
        print(f"Error submitting Dataproc job: {e}")
        # -- REMARK: This is where you would update Firestore with an 'error' status
        # and provide more details about the failure.
        # Example: doc_ref.set({'status': 'error', 'error_message': str(e)})
        return
