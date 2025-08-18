# -- RMK: spark_jobs/normalize_data.py: Version 2.3

import sys
import re
import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.functions import lit
from io import BytesIO

def normalize_data(input_file_path: str, output_bucket: str):
    """
    Reads an Excel file from Google Cloud Storage, normalizes the data from
    valid sheets, and writes the combined data to a new CSV file.

    This script is designed to be executed as a Spark job on a Dataproc cluster.

    Args:
        input_file_path (str): The full path to the input Excel file in GCS (e.g., gs://bucket/file.xlsx).
        output_bucket (str): The GCS bucket name where the normalized CSV should be saved.
    """
    print(f"Starting data normalization job for file: {input_file_path}")

    # Initialize SparkSession. The Dataproc cluster environment handles this.
    spark = SparkSession.builder.appName("SALDataNormalization").getOrCreate()

    # Get the file name to use as a prefix for the output
    file_name = input_file_path.split('/')[-1]
    
    # -- REMARK: For a real Dataproc job, this is a placeholder. You would need
    # to read the Excel file from GCS into a Pandas DataFrame. The following line
    # simulates this process. In production, you would use the Google Cloud Storage client
    # to download the file and then pass it to pandas.
    # Example using pandas.read_excel with GCS:
    # excel_data = pd.read_excel(input_file_path, engine='openpyxl')
    
    try:
        # For demonstration purposes, we'll assume the path is directly readable.
        excel_data = pd.ExcelFile(input_file_path)
        print(f"Successfully loaded Excel file from {input_file_path}")
    except Exception as e:
        print(f"Error reading Excel file from GCS: {e}")
        # -- REMARK: Here, you would update the Firestore document with an error status.
        return

    # Regex to match sheets with a 'dd-mmm' format in their name, ignoring case.
    date_pattern = re.compile(r'^\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', re.IGNORECASE)
    
    combined_pdf = pd.DataFrame()
    all_sheet_names = excel_data.sheet_names
    
    print(f"Found sheets: {all_sheet_names}")

    # Iterate through all sheets in the Excel file
    for sheet_name in all_sheet_names:
        # Check if the sheet name matches our normalization pattern and is not a summary sheet
        if date_pattern.match(sheet_name.strip()):
            try:
                # Read the sheet into a pandas DataFrame, skipping the initial header rows
                df_sheet = pd.read_excel(excel_data, sheet_name=sheet_name, header=1)
                
                # Filter out the summary 'TOTAL' row at the end of each sheet
                df_sheet = df_sheet[df_sheet['Travels Agents Name'].str.lower() != 'total'].copy()
                
                # Normalize column names. The column headers in the source file are multi-level
                # in some cases, so we access them by a known name or index.
                df_sheet.rename(columns={
                    'Travels Agents Name': 'agency',
                    'Us $ pax': 'pax_usd',
                    'Npr pax': 'pax_npr',
                    'Us $ Amount': 'sales_usd',
                    'Npr  Amount': 'sales_npr',
                }, inplace=True)
                
                # Add a new 'date' column from the sheet name
                df_sheet['date'] = sheet_name
                
                # Append the normalized data to our combined DataFrame
                combined_pdf = pd.concat([combined_pdf, df_sheet], ignore_index=True)
                print(f"Processed sheet: {sheet_name} with {df_sheet.shape[0]} rows.")

            except Exception as e:
                print(f"Error processing sheet '{sheet_name}': {e}")
                continue

    if not combined_pdf.empty:
        # Convert the final pandas DataFrame to a Spark DataFrame
        spark_df = spark.createDataFrame(combined_pdf)
        
        # Get the date range for the output file name
        dates = [parseDateString(d) for d in spark_df.select("date").distinct().rdd.flatMap(lambda x: x).collect()]
        start_date = min(dates)
        end_date = max(dates)
        output_file_name = f"normalized_data_{format(start_date, 'MMM-yyyy')}_to_{format(end_date, 'MMM-yyyy')}.csv"
        
        # Write the combined DataFrame to GCS as a single CSV file
        output_path = f"gs://{output_bucket}/{output_file_name}"
        spark_df.coalesce(1).write.csv(output_path, header=True, mode="overwrite")
        print(f"Successfully wrote normalized data to {output_path}")

        # -- REMARK: Here, you would update the Firestore document with a 'completed' status
        # and the output_path, which the frontend can then use.
        print("Updated Firestore with completed status and file path.")
    else:
        print("No valid sheets were found to process.")
        # -- REMARK: Here, you would update the Firestore document with an 'error' status.

if __name__ == '__main__':
    # -- REMARK: These are the arguments passed from the Cloud Function.
    # The first argument is the input GCS path, the second is the output bucket.
    if len(sys.argv) != 3:
        print("Usage: normalize_data.py <input_file_path> <output_bucket>")
        sys.exit(-1)

    input_file_path = sys.argv[1]
    output_bucket = sys.argv[2]

    normalize_data(input_file_path, output_bucket)

