from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import functions_framework  # Required for Firebase integration

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

key = "LbhIKjD6.Rf0gJ7HTvYuDKy5tpSuCirzMOEiWtdzZ"
url = "https://payload.vextapp.com/hook/JPRCRIQZJJ/catch/none"

headers = {
    "Content-Type": "application/json",
    "Apikey": f"Api-Key {key}"
}

@app.route('/api/bot', methods=['POST'])
def bot():
    data = request.get_json()

    print(f"Received request: {data}")

    message = data.get('message', '')

    payload_data = {
        "payload": message
    }

    response = requests.post(url, headers=headers, json=payload_data)

    if response.status_code == 200:
        response_data = response.json()
        reply_text = response_data.get('text', 'No response text found')
        reply = f"Bruce: {reply_text}"
    else:
        reply = f"Error: {response.status_code}, {response.text}"

    return jsonify({'reply': reply})


# Firebase requires an entry point called `app`
@functions_framework.http
def app(request):
    return app(request)
