from flask import Flask, send_from_directory

HOST_IP = '0.0.0.0'
WEB_PORT = '8000'

# Flask Web server
app = Flask(__name__)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

print('Running web server at %s:%s' % (HOST_IP, WEB_PORT))
app.run(host=HOST_IP, port=WEB_PORT)
