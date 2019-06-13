import subprocess
import threading

import IPython, time, os

from flask import Flask, request
from flask_socketio import SocketIO, send, emit

#from engineio import async_eventlet

import socket
def get_ip_address():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    return s.getsockname()[0]

HOST_IP = '0.0.0.0'
SOCKETIO_PORT = '8081'
WEB_PORT = '8000'


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
#socketio = SocketIO(app, async_mode='eventlet')
socketio = SocketIO(app, async_mode='threading')
# socketio = SocketIO(app)

old_chats = []
all_users = []
project_tree = {
    'current_dir': '',
    'dirs': [],
    'files': []
}
root_path = ''

@socketio.on('connect')
def handle_connect():
    global all_users, old_chats, project_tree, root_path

    dir_dict = make_dir_node(os.getcwd())
    root_path = os.path.dirname(os.getcwd())
    project_tree = dir_dict
    socketio.emit('send-directory-dict', dir_dict)

    all_users.append({
        'username': '',
        'index': len(all_users) + 1,
        'sid': request.sid,
        'perms': {
            'is_admin': False,
            'is_owner': False,
            'is_writable': True,
            'is_blocked': False
        },
        'remote_addr': request.remote_addr,
        'has_initial_data_package': False
    })
    print('New client connected. Total: ' + str(len(all_users)))

    if len(all_users) <= 1:
        all_users[0]['perms']['is_owner'] = True
        all_users[0]['perms']['is_admin'] = True
        all_users[0]['perms']['is_writable'] = True

    for user in all_users:
        if user['perms']['is_owner']:
            socketio.emit('get-data-package', room=user['sid'])
            break

    emit('update-all-users', all_users, broadcast=True)

    for chat in old_chats:
        emit('chat-message', chat)

@socketio.on('get-data-package')
def handle_get_data_package(data):
    global all_users, project_tree
    print(data)
    for user in all_users:
        if not user['has_initial_data_package']:
            data['userId'] = user['index']
            data['userSID'] = user['sid']
            data['all_users'] = all_users
            socketio.emit('initial-data-package', data, room=user['sid'])
            socketio.emit('send-directory-dict', project_tree, room=user['sid'])
            for userB in all_users:
                if user['sid'] != userB['sid']:
                    socketio.emit('add-new-user-cursor', user, room=userB['sid'])
            user['has_initial_data_package'] = True
    print(all_users)

@socketio.on('set-username')
def handle_set_username(data):
    global all_users
    for user in all_users:
        if user['sid'] == request.sid:
            user['username'] = data['username']
    emit('update-all-users', all_users, broadcast=True)
    print(all_users)

@socketio.on('set-permissions')
def handle_set_permissions(new_user_perms):
    """ new_user_perms = { 'sid': <sid>, 'perms': <perm_obj> } """
    global all_users
    for user in all_users:
        if user['sid'] == request.sid and user['perms']['is_admin']:
            for userB in all_users:
                if userB['sid'] == new_user_perms['sid']:
                    try:
                        userB['perms']['is_blocked'] = new_user_perms['perms']['is_blocked']
                    except KeyError:
                        pass
                    try:
                        userB['perms']['is_writable'] = new_user_perms['perms']['is_writable']
                    except KeyError:
                        pass
                    try:
                        # Owner cannot unadmin him/her self
                        if user['sid'] == userB['sid'] and user['perms']['is_owner']:
                            pass
                        else:
                            userB['perms']['is_admin'] = new_user_perms['perms']['is_admin']
                    except KeyError:
                        pass
                    break
            break
    emit('update-all-users', all_users, broadcast=True)
    print(all_users)

@socketio.on('get-ip')
def handle_get_ip():
    emit('get-ip', get_ip_address() +':'+ WEB_PORT)



CONSOLE_BIN = 'python'
@socketio.on('send-to-console')
def handle_send_to_console(inputString):
    console_output = ''
    with subprocess.Popen(CONSOLE_BIN, stdout=subprocess.PIPE, stdin=subprocess.PIPE) as process:
        with process.stdin as pipe:
            pipe.write(inputString.encode());
        for line in process.stdout:
            console_output += line.decode('utf-8')
    emit('get-output-from-console', (inputString, console_output), broadcast=True)



@socketio.on('set-file-path')
def handle_set_file_path(path):
    global root_path
    socketio.emit('clear-all-data')
    name = os.path.join(root_path, os.path.join(*path))
    print(name)
    name = name.strip()
    if os.path.isfile(name):
        with open(name, 'r') as rf:
            for line in rf.readlines():
                socketio.emit('update-file-data', line.strip())


@socketio.on('save-file')
def handle_save_file(fileName, data):
    print('Saving file: %s / %s' % (fileName, data))
    with open(fileName, 'w') as wf:
        for line in data:
            wf.write(line + '\n')

    """
@socketio.on('get-text-update')
def handle_get_text_update(html_text):
    global global_html_text
    global_html_text = html_text
    emit('text-update', global_html_text, broadcast=True)

@socketio.on('text-update')
def handle_text_update(html_text):
    global global_html_text
    global_html_text = html_text
    print (global_html_text)
    """


    """
@socketio.on('disconnect')
def handle_connect():
    global total_connected
    total_connected -= 1
    print('Client disconnected. Total: ' + str(total_connected))
    emit('total-connected', total_connected, broadcast=True)
    """


@socketio.on('chat-message')
def handle_message(message):
    global old_chats
    old_chats.append(message)
    emit('chat-message', message, broadcast=True)


@socketio.on('update-key-down')
def handle_updatekd(key, cursorHTML):
    print(key, cursorHTML)
    emit('update-key-down', (key, cursorHTML), broadcast=True)


@socketio.on('update-key-press')
def handle_updatekp(character, cursorHTML):
    print(character, cursorHTML)
    for user in all_users:
        if request.sid == user['sid'] and user['perms']['is_writable']:
            emit('update-key-press', (character, cursorHTML), broadcast=True)

@socketio.on('update-click')
def handle_update_click(posX, posY, cursorHTML):
    print(posX, posY, cursorHTML)
    emit('update-click', (posX, posY, cursorHTML), broadcast=True)



    """
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
    """

def make_dir_node (node):
    node_dict = {}
    node_dict['current_dir'] = os.path.basename(node)
    node_dict['files'] = []
    node_dict['dirs'] = []
    for f in os.listdir(node):
        if os.path.isfile(os.path.join(node, f)):
            node_dict['files'].append(f)
        if os.path.isdir(os.path.join(node, f)):
            node_dict['dirs'].append(make_dir_node(os.path.join(node, f)))
    return node_dict


def start_window():
    global project_tree, CONSOLE_BIN
    process = subprocess.Popen(['python', 'window.py'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    #for name in process.stdout.readline():
    while True:
        name = process.stdout.readline()
        if name == '':
            break
        print(name)
        name = name.strip()
        if len(name) > 0:
            nameArray = name.split('|')
            operation = nameArray[0]
            name = nameArray[1]
            if name == '':
                if operation == 'SET_BOLD':
                    socketio.emit('set-html-tag', ('b', ''))
                elif operation == 'SET_ITALICS':
                    socketio.emit('set-html-tag', ('em', ''))
                elif operation == 'SET_HTML_TAG':
                    attributes = nameArray[2]
                    socketio.emit('set-html-tag', (name, attributes))
            elif os.path.isfile(name):
                if operation == 'OPEN':
                    with open(name, 'r') as rf:
                        for line in rf.readlines():
                            print('APP.PY:'+line.strip())
                            socketio.emit('update-file-data', line.strip())
                elif operation == 'SCONSOLE':
                    CONSOLE_BIN = name
            elif os.path.isdir(name):
                if operation == 'DIR':
                    root_path = name
                    dir_dict = make_dir_node(name)
                    print(dir_dict)
                    project_tree = dir_dict
                    socketio.emit('send-directory-dict', dir_dict)

            if operation == 'SAVE':
                socketio.emit('get-file-data-to-save', name)

def start_socket_server():
    print('Running socket server at %s:%s' % (HOST_IP, SOCKETIO_PORT))
    socketio.run(app, host=HOST_IP, port=SOCKETIO_PORT)

def start_webserver():
    subprocess.Popen(['python', 'webserver.py'], stderr=subprocess.STDOUT)

if __name__ == '__main__':
    p1 = threading.Thread(target=start_webserver)
    p2 = threading.Thread(target=start_socket_server)
    p3 = threading.Thread(target=start_window)

    p1.start()
    p2.start()
    p3.start()

    p1.join()
    p2.join()
    p3.join()
