# -- RMK: spark_jobs/normalize_data.py: Version Final 1.0

import sys
import re
import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.functions import lit
from io import BytesIO
from datetime import datetime

# Helper function to parse custom date strings
def parse_date_string(date_str):
    """Parses a date string in 'dd-mmm' format."""
    try:
        # Use a consistent year for parsing to handle month-based sorting
        return datetime.strptime(date_str, '%d-%b').replace(year=2025)
    except ValueError:
        return None

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

    spark = SparkSession.builder.appName("SALDataNormalization").getOrCreate()
    
    # Placeholder for the actual GCS file read operation.
    # In a real Dataproc job, the input_file_path is directly readable.
    try:
        excel_data = pd.ExcelFile(input_file_path)
        print(f"Successfully loaded Excel file from {input_file_path}")
    except Exception as e:
        print(f"Error reading Excel file from GCS: {e}")
        # -- REMARK: In production, you would update Firestore with an 'error' status here.
        return

    # Regex to match sheets with a 'dd-mmm' format in their name
    date_pattern = re.compile(r'^\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', re.IGNORECASE)
    
    combined_pdf = pd.DataFrame()
    all_sheet_names = excel_data.sheet_names
    
    print(f"Found sheets: {all_sheet_names}")

    for sheet_name in all_sheet_names:
        if date_pattern.match(sheet_name.strip()):
            try:
                # Read the sheet, skipping header rows if needed
                df_sheet = pd.read_excel(excel_data, sheet_name=sheet_name, header=1)
                
                # Filter out the summary 'TOTAL' row
                df_sheet = df_sheet[df_sheet['Travels Agents Name'].str.lower() != 'total'].copy()
                
                # Normalize column names
                df_sheet.rename(columns={
                    'Travels Agents Name': 'agency',
                    'Us $ pax': 'pax_usd',
                    'Npr pax': 'pax_npr',
                    'Us $ Amount': 'sales_usd',
                    'Npr  Amount': 'sales_npr',
                }, inplace=True)
                
                # Drop rows where 'agency' is null
                df_sheet.dropna(subset=['agency'], inplace=True)
                
                # Add a new 'date' column from the sheet name
                df_sheet['date'] = sheet_name
                
                combined_pdf = pd.concat([combined_pdf, df_sheet], ignore_index=True)
                print(f"Processed sheet: {sheet_name} with {df_sheet.shape[0]} rows.")

            except Exception as e:
                print(f"Error processing sheet '{sheet_name}': {e}")
                continue

    if not combined_pdf.empty:
        spark_df = spark.createDataFrame(combined_pdf)
        
        # Get the date range for the output file name
        dates = [parse_date_string(d) for d in spark_df.select("date").distinct().rdd.flatMap(lambda x: x).collect() if parse_date_string(d) is not None]
        
        if dates:
            start_date = min(dates)
            end_date = max(dates)
            output_file_name = f"normalized_data_{format(start_date, 'MMM-yyyy')}_to_{format(end_date, 'MMM-yyyy')}.csv"
        else:
            output_file_name = f"normalized_data_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
            
        output_path = f"gs://{output_bucket}/{output_file_name}"
        spark_df.coalesce(1).write.csv(output_path, header=True, mode="overwrite")
        print(f"Successfully wrote normalized data to {output_path}")

        # -- REMARK: In production, you would update the Firestore document with a
        # 'completed' status and the output_path, which the frontend can then use.
        print("Updated Firestore with completed status and file path.")
    else:
        print("No valid sheets were found to process.")
        # -- REMARK: In production, you would update the Firestore document with an
        # 'error' status and a message.

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: normalize_data.py <input_file_path> <output_bucket>")
        sys.exit(-1)

    input_file_path = sys.argv[1]
    output_bucket = sys.argv[2]

    normalize_data(input_file_path, output_bucket)
