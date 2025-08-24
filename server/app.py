from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

@app.route('/get_flood_polygons', methods=['GET'])
def get_flood_polygons():
    # Get the absolute path to the GeoJSON file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, "mumbai_flood_land_aug2025.geojson")
    
    try:
        with open(file_path, "r") as f:
            data = json.load(f)

        # Keep only the first 50 features
        data_50 = data.copy()
        data_50["features"] = data["features"]

        return jsonify(data_50)
    except FileNotFoundError:
        return jsonify({"error": f"GeoJSON file not found at {file_path}"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/resources', methods=['GET'])
def get_resources():
    resources = [
        {
            "id": 1,
            "name": "Ambulance Unit Alpha",
            "type": "vehicle",
            "status": "available",
            "location": "Central Mumbai",
            "quantity": 1,
            "updatedAt": "2025-08-25T00:00:00Z"
        },
        {
            "id": 2,
            "name": "Medical Supplies Kit",
            "type": "medical",
            "status": "in-use",
            "location": "Bandra Hospital",
            "quantity": 5,
            "updatedAt": "2025-08-25T00:00:00Z"
        }
    ]
    return jsonify({"resources": resources})

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    incidents = [
        {
            "id": 1,
            "title": "Flooding in Kurla",
            "description": "Heavy waterlogging reported",
            "lat": 19.0728,
            "lng": 72.8826,
            "status": "active",
            "severity": "high"
        }
    ]
    return jsonify({"incidents": incidents})

# Add a test route
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Flask server is running!", "status": "OK"})

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')