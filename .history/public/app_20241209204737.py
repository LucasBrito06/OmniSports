from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/bot', methods=['POST'])
def bot_reply():
    user_message = request.json.get('message')

    # Simple bot logic for response
    if user_message.lower() == "hello":
        reply = "Hello! How can I help you today?"
    else:
        reply = "I'm sorry, I didn't understand that."

    return jsonify({'reply': reply})

if __name__ == '__main__':
    app.run(debug=True)
