from flask import Flask, request, jsonify
from flask_cors import CORS
import json 
import requests

app = Flask(__name__)
CORS(app)  # Enables CORS for all routes

key = "LbhIKjD6.Rf0gJ7HTvYuDKy5tpSuCirzMOEiWtdzZ"
url = "https://payload.vextapp.com/hook/JPRCRIQZJJ/catch/none"

headers = {
    "Content-Type": "application/json",
    "Apikey":  f"Api-Key {key}"
}

@app.route('/api/bot', methods=['POST'])
def bot():
    data = request.get_json()

    print(f"Received request: {data}")

    message = data.get('message', '')

    data = {
        "payload": "{message}"
    }

    response = requests.post(url, headers=headers, json=data)

    reply = f"Bruce: {response.text}"

    return jsonify({'reply': reply})

if __name__ == '__main__':
    app.run(debug=True)
