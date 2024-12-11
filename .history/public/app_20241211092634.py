from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/bot', methods=['POST'])
def bot_reply():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    user_message = data['message']
    bot_reply = f"Echo: {user_message}"  # Example logic
    return jsonify({"reply": bot_reply})

if __name__ == '__main__':
    app.run(debug=True)
