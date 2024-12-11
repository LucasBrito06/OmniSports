from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables CORS for all routes

@app.route('/api/bot', methods=['POST'])
def bot():
    data = request.get_json()
    message = data.get('message', '')
    reply = f"Bot received: {message}"  # Example reply
    return jsonify({'reply': reply})

if __name__ == '__main__':
    app.run(debug=True)
