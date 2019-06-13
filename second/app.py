import subprocess

from flask import Flask
from flask_socketio import SocketIO, send, emit

from engineio import async_eventlet

HOST_IP = '0.0.0.0'
SOCKETIO_PORT = '8080'


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')
# socketio = SocketIO(app)

total_connected = 0
cursor_pos_list = []
global_html_text = ''


@socketio.on('connect')
def handle_connect():
    global total_connected, global_html_text
    total_connected += 1
    print('New client connected. Total: ' + str(total_connected))
    emit('total-connected', total_connected, broadcast=True)
    emit('text-update', global_html_text)


@socketio.on('disconnect')
def handle_connect():
    global total_connected
    total_connected -= 1
    print('Client disconnected. Total: ' + str(total_connected))
    emit('total-connected', total_connected, broadcast=True)


@socketio.on('chat-message')
def handle_message(message):
    emit('chat-message', message, broadcast=True)


@socketio.on('update-key-down')
def handle_updatekd(key, cursorIndex, cursorHTML):
    print(key, cursorIndex, cursorHTML)
    emit('update-key-down', (key, cursorIndex, cursorHTML), broadcast=True)


@socketio.on('update-key-press')
def handle_updatekp(character, cursorHTML):
    print(character, cursorHTML)
    emit('update-key-press', (character, cursorHTML), broadcast=True)


@socketio.on('cursor-update')
def handle_cursor_update(cursorPos):
    global cursor_pos_list
    cursor_present = False
    for cursor in cursor_pos_list:
        if cursorPos['cursorHTML'] == cursor['cursorHTML']:
            cursor['cursorIndex'] = cursorPos['cursorIndex']
            cursor_present = True
            break
    if not cursor_present:
        cursor_pos_list.append(cursorPos)
    print(cursor_pos_list)
    #emit('cursor-update', cursor_pos_list, broadcast=True)

@socketio.on('get-text-update')
def handle_get_text_update():
    global global_html_text
    emit('get-text-update', broadcast=True)

@socketio.on('text-update')
def handle_text_update(html_text):
    global global_html_text
    global_html_text = html_text
    print (global_html_text)
    emit('text-update', global_html_text, broadcast=True)




if __name__ == '__main__':
    subprocess.Popen(['python', 'webserver.py'], stderr=subprocess.STDOUT)

    #subprocess.Popen(['python', 'window.py'], stderr=subprocess.STDOUT)

    print('Running socket server at %s:%s' % (HOST_IP, SOCKETIO_PORT))
    socketio.run(app, host=HOST_IP, port=SOCKETIO_PORT)
