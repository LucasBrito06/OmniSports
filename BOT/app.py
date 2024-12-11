from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enables CORS for all routes

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

    # Correctly format the message in the payload
    payload_data = {
        "payload": message
    }

    # Send the POST request to the target URL
    response = requests.post(url, headers=headers, json=payload_data)

    # Check if the response was successful and handle it accordingly
    if response.status_code == 200:
        response_data = response.json()  # Parse the response as JSON
        reply_text = response_data.get('text', 'No response text found')  # Extract the text field
        reply = f"Bruce: {reply_text}"  # Use the extracted text for the reply
    else:
        reply = f"Error: {response.status_code}, {response.text}"

    return jsonify({'reply': reply})

if __name__ == '__main__':
    app.run(debug=True)