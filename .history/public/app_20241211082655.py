from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/bot', methods=['POST'])
def bot_reply():
    user_message = request.json.get('message')

    reply = user_message

    return jsonify({'reply': reply})

if __name__ == '__main__':
    app.run(debug=True)
