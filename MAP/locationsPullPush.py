import os
import requests
import json
import time
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
def initialize_firebase():
    try:
        current_dir = os.path.dirname(__file__)  # Directory of the current script
        cred_path = r"C:\Users\caiof\OneDrive\Área de Trabalho\Faculdade\Projetos aplicações interativas\OmniSports-main\Projeto-Aplicacao-Interativa-main\firebase_credentials.json"  # Replace with the full path

        print(f"Using credentials file at: {cred_path}")
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"Credentials file not found at {cred_path}")
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        exit()

# Upload data to Firestore
def upload_to_firestore(db, collection_name, data):
    for idx, place in enumerate(data):
        try:
            doc_id = f"place_{idx}"
            db.collection(collection_name).document(doc_id).set(place)
            print(f"Uploaded: {place['name']} at {place['latitude']}, {place['longitude']}")
        except Exception as e:
            print(f"Failed to upload {place['name']}: {e}")

# Delete documents from Firestore where the name is "Unknown"
def delete_unknown_places(db, collection_name):
    try:
        unknown_places = db.collection(collection_name).where("name", "==", "Unknown").stream()

        deleted_count = 0
        for place in unknown_places:
            doc_id = place.id
            db.collection(collection_name).document(doc_id).delete()
            print(f"Deleted document: {doc_id}")
            deleted_count += 1

        print(f"Total documents deleted: {deleted_count}")
    except Exception as e:
        print(f"Error deleting unknown places: {e}")

def fetch_foursquare_sports_places_for_point(latitude, longitude, radius, api_key):
    """Fetch sports places for a single point and radius from Foursquare."""
    url = "https://api.foursquare.com/v3/places/search"
    headers = {
        "Authorization": api_key
    }
    params = {
        "ll": f"{latitude},{longitude}",
        "query": "sports",
        "radius": radius,
        "limit": 50
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            # If we reach this point, the request succeeded
            break
        except requests.exceptions.HTTPError as e:
            if response.status_code == 500 and attempt < max_retries - 1:
                print(f"Server error (500) at {latitude},{longitude}, retrying in 5 seconds...")
                time.sleep(5)  # Wait 5 seconds before retrying
            else:
                print(f"Error fetching data from Foursquare API at {latitude},{longitude}: {e}")
                return []
        except requests.exceptions.RequestException as e:
            # For other request exceptions, just print and return empty
            print(f"Error fetching data from Foursquare API at {latitude},{longitude}: {e}")
            return []
    
    # If after max_retries we do not have a successful response, return empty
    if response.status_code != 200:
        return []

    try:
        data = response.json()
        places_info = []
        for item in data.get('results', []):
            geocodes = item.get("geocodes", {}).get("main", {})
            location = item.get("location", {})
            categories = item.get("categories", [])

            sports = [category.get("name", "Unknown") for category in categories if category.get("name")]

            place = {
                "name": item.get("name", "Unknown"),
                "latitude": geocodes.get("latitude"),
                "longitude": geocodes.get("longitude"),
                "city": location.get("locality", "Unknown"),
                "country": location.get("country", "Unknown"),
                "sports": sports if sports else ["Unknown"]
            }

            places_info.append(place)

        # Filter out places with name "Unknown"
        filtered_places = [place for place in places_info if place["name"].lower() != "unknown"]

        return filtered_places
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response at {latitude},{longitude}: {e}")
        return []

def get_sports_places_entire_city(db, api_key):
    # Approximate bounding box for the city of Rio de Janeiro
    # These coordinates are approximate. You may need to adjust them for better accuracy.
    # Rio de Janeiro city approximate bounding box:
    #   North: -22.7
    #   South: -23.0
    #   West:  -43.8
    #   East:  -43.0
    lat_start, lat_end = -23.0, -22.7
    lon_start, lon_end = -43.8, -43.0

    # Steps and radius can be adjusted based on coverage needs
    lat_step = 0.05
    lon_step = 0.05
    radius = 5000  # 5 km radius for each point

    all_places = []
    seen_places = set()  # To avoid duplicates

    current_lat = lat_start
    while current_lat <= lat_end:
        current_lon = lon_start
        while current_lon <= lon_end:
            fetched_places = fetch_foursquare_sports_places_for_point(current_lat, current_lon, radius, api_key)
            for p in fetched_places:
                # Use a tuple (name, lat, lon) as a unique key
                key = (p["name"].lower(), p["latitude"], p["longitude"])
                if key not in seen_places:
                    seen_places.add(key)
                    all_places.append(p)

            current_lon += lon_step
            # Sleep a bit to avoid hitting rate limits further
            time.sleep(1)
        current_lat += lat_step

    print(f"Total unique places fetched: {len(all_places)}")

    upload_to_firestore(db, "sports_places", all_places)


# Initialize Firebase and Firestore
db = initialize_firebase()

# Define your Foursquare API key
foursquare_api_key = "fsq344beZVFqly38bvvd1HidrG6GdTmarEyucNZTQPzDXfY="  # Replace with your Foursquare API key

# Define collection name
collection_name = "sports_places"

# Fetch and upload sports locations for the entire city of Rio de Janeiro
get_sports_places_entire_city(db, foursquare_api_key)

# Clean up "Unknown" places from Firestore, if any remain
delete_unknown_places(db, collection_name)
