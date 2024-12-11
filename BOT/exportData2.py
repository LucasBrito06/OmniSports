import firebase_admin
from firebase_admin import credentials, firestore
import json
import csv

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase_credentials.json")  # Update with your credentials file
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

def is_valid_document(doc):
    """
    Check if the document contains all required fields with valid values.
    """
    required_fields = ["name", "city", "country", "latitude", "longitude", "sports"]
    for field in required_fields:
        if field not in doc or (field == "sports" and not isinstance(doc[field], list)) or not doc[field]:
            return False
    return True

def prepare_data(doc_id, doc_data):
    """
    Prepare a single document for export, replacing missing fields with defaults.
    """
    return {
        "id": doc_id,
        "name": doc_data.get("name", "Unknown"),
        "city": doc_data.get("city", "Unknown"),
        "country": doc_data.get("country", "Unknown"),
        "latitude": doc_data.get("latitude", "Unknown"),
        "longitude": doc_data.get("longitude", "Unknown"),
        "sports": doc_data.get("sports", [])
    }

def export_to_json(data, output_file):
    """
    Export data to a JSON file.
    """
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Exported {len(data)} records to {output_file}")

def export_to_csv(data, output_file):
    """
    Export data to a CSV file.
    """
    with open(output_file, "w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "city", "country", "latitude", "longitude", "sports"])
        writer.writeheader()
        for row in data:
            row["sports"] = ", ".join(row["sports"])  # Convert list to comma-separated string
            writer.writerow(row)
    print(f"Exported {len(data)} records to {output_file}")

def export_firestore_data(collection_name, output_file, output_format="json"):
    """
    Export Firestore data, validating and preparing it for Vext Portal upload.
    """
    docs = db.collection(collection_name).stream()
    valid_data = [
        prepare_data(doc.id, doc.to_dict()) for doc in docs if is_valid_document(doc.to_dict())
    ]

    if output_format == "json":
        export_to_json(valid_data, output_file)
    elif output_format == "csv":
        export_to_csv(valid_data, output_file)
    else:
        print("Unsupported format. Use 'json' or 'csv'.")

# Usage
collection_name = "sports_places"  # Replace with your collection name
output_file_json = "vext_data.json"
output_file_csv = "vext_data.csv"

# Export as JSON
export_firestore_data(collection_name, output_file_json, output_format="json")

# Export as CSV (optional)
export_firestore_data(collection_name, output_file_csv, output_format="csv")
