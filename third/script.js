


//var allTextEditorLines = ['<b>'+userCursorHTML+'</b>initial <b>cond</b>ition','new <b></b>line'];

//var userCursorHTML = '<span class="cursor cursor-1"></span>';
//var allTextEditorLines = [userCursorHTML];
var userCursorHTML = '';
var allTextEditorLines = [''];
var cursorOnLines = {};

var all_users = [];

var myUserSID = '';
var myUserId = 0;
var myUsername = '';

$(function(){
    /*
     * this swallows backspace keys on any non-input element.
     * stops backspace -> back
     */
    var rx = /INPUT|SELECT|TEXTAREA/i;

    $(document).bind("keydown keypress", function(e){
        if( e.which == 8 ){ // 8 == backspace
            if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                e.preventDefault();
            }
        }
    });
});


function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}
function isScrolledIntoView(elem)
{
    var docViewTop = $('#text-editor-wrapper').offset().top;
    var docViewBottom = docViewTop + $('#text-editor-wrapper').height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
function setUsernameOnCursorStyle () {
    // $("head").append('<style type="text/css"></style>');
    var newStyleElement = $("head").children(':last');
    var allCSS = '';
    for (var user in all_users) {
        allCSS += '.cursor.cursor-'+all_users[user].index+'::after {content: " ' + all_users[user].username + ' ";} ';
    }
    newStyleElement.html(allCSS);
}
function addToAdminPanel () {
    var adminPanel = $('#admin-panel');
    adminPanel.html('');
    console.log(all_users);
    for (var user in all_users) {
        if (all_users[user].perms.is_owner) {
            adminPanel.append('<div class="color-'+all_users[user].index+'" user-id="'+all_users[user].index+'">'+all_users[user].username+' <span class="read-write green">ADMIN</span> <span class="read-write blue">OWNER</span></div>');
        } else {
            var permissionsHTML = ' ';
            if (all_users[user].perms.is_writable) {
                permissionsHTML += '<span class="read-write green" onclick="setPermission(\'WRITE\', '+all_users[user].index+')">WRITE</span> ';
            } else {
                permissionsHTML += '<span class="read-write red" onclick="setPermission(\'WRITE\', '+all_users[user].index+')">WRITE</span> ';
            }
            if (all_users[user].perms.is_blocked) {
                permissionsHTML += '<span class="read-write greed" onclick="setPermission(\'BLOCK\', '+all_users[user].index+')">UNBLOCK</span> ';
            } else {
                permissionsHTML += '<span class="read-write red" onclick="setPermission(\'BLOCK\', '+all_users[user].index+')">BLOCK</span> ';
            }
            if (all_users[user].perms.is_admin) {
                permissionsHTML += '<span class="read-write red" onclick="setPermission(\'ADMIN\', '+all_users[user].index+')">UNADMIN</span>';
            } else {
                permissionsHTML += '<span class="read-write blue" onclick="setPermission(\'ADMIN\', '+all_users[user].index+')">MAKE ADMIN</span>';
            }
            adminPanel.append('<div class="color-'+all_users[user].index+'">'+all_users[user].username + permissionsHTML + '</div>');
        }
    }
}
function setPermission (perm, userId) {
    var myUser = all_users[myUserId - 1];
    if (!myUser.perms.is_admin) {
        alert('You are not an admin, Please ask for admin permissions if you want to change the permissions');
    } else {
        var user = all_users[userId - 1];
        var permObj = {};
        if (perm == 'WRITE') {
            permObj.is_writable = !user.perms.is_writable;
        }
        if (perm == 'BLOCK') {
            permObj.is_blocked = !user.perms.is_blocked;
        }
        if (perm == 'ADMIN') {
            permObj.is_admin = !user.perms.is_admin;
        }
        console.log('Emitting set-permissions');
        console.log(permObj);
        socket.emit('set-permissions', {
            sid: user.sid,
            perms: permObj
        });
    }
}
function addNewUserCursor (userId) {
    var cursorHTML = '<span class="cursor cursor-'+userId+'"></span>';
    cursorOnLines[cursorHTML] = [0,0];
    writeOneLineToDOM(0, cursorHTML + allTextEditorLines[0]);
}

var socket = io.connect('http://'+window.location.hostname+':8081/');
socket.on('connect', function() {
    console.log('SocketIO Connected to: http://'+window.location.hostname+':8081/');
    socket.emit('get-ip');
    myUsername = setUsername();
    socket.emit('set-username', {
        username: myUsername
    });
});
socket.on('get-ip', function(ip) {
    // $('#status-box').html('Please share this link: http://' + ip + '/index.html');
    console.log('Recieved get-ip');
    $('#status-box').html('Please share this link: http://' + ip);
});
socket.on('get-data-package', function() {
    console.log('Recieved get-data-package');
    var data = {
        allTextEditorLines: allTextEditorLines,
        cursorOnLines: cursorOnLines
    };
    console.log('Emitting get data package');
    socket.emit('get-data-package', data);
});
socket.on('add-new-user-cursor', function(user) {
    console.log('Recieved add-new-user-cursor');
    console.log(user);
    addNewUserCursor(user.index);
});
socket.on('initial-data-package', function(data) {
    console.log('Recieved initial-data-package');
    console.log(data);

    myUserId = data.userId;
    myUserSID = data.userSID;
    userCursorHTML = '<span class="cursor cursor-'+myUserId+'"></span>';
    allTextEditorLines = Array.prototype.concat(data.allTextEditorLines);
    cursorOnLines = data.cursorOnLines;

    addNewUserCursor(myUserId);

    writeAllLinesToDOM();
});
socket.on('update-all-users', function(all_users_server) {
    console.log('Recieved update-all-users');
    all_users = Array.prototype.concat(all_users_server);
    setUsernameOnCursorStyle();
    addToAdminPanel();
    if (myUserId && all_users[myUserId - 1].perms.is_blocked) {
        alert('You have been BLOCKED! Please ask for the admin to unblock you.');
        socket.disconnect();
    }
});
socket.on('chat-message', function(msg) {
    console.log('Recieved chat-message');
    document.getElementById('message-box').innerHTML += msg + '<br>';
});
function send_message() {
    socket.emit('chat-message', '<b class="color-'+myUserId+'">' + myUsername + '</b>: ' + document.getElementById('message-input').value);
    document.getElementById('message-input').value = '';
}
socket.on('update-key-down', function(key, cursorHTML) {
    console.log(key, cursorHTML);
    if (cursorHTML != userCursorHTML) {
        handleKey(key, cursorHTML);
    }
});
socket.on('update-key-press', function(character, cursorHTML) {
    console.log(character, cursorHTML);
    if (cursorHTML != userCursorHTML) {
        placeBeforeCursor(cursorHTML, String.fromCharCode(character));
    }
});
socket.on('update-click', function(posX, posY, cursorHTML) {
    console.log('Recieved update-click');
    console.log(posX, posY, cursorHTML);
    if (cursorHTML != userCursorHTML) {
        changeCursorPosition(posY, posX, cursorHTML);
    }
});
socket.on('clear-all-data', function() {
    console.log('Recieved clear-all-data');
    for (var cursor in cursorOnLines) {
        cursorOnLines[cursor] = [0,0];
    }
    allTextEditorLines = [Object.keys(cursorOnLines).join('')];
    writeAllLinesToDOM();
});
socket.on('update-file-data', function(line) {
    console.log('Recieved update-file-data');
    writeOneLineToDOM(allTextEditorLines.length, line);
});
socket.on('get-file-data-to-save', function(fileName) {
    console.log('Recieved get-file-data-to-save');
    var data = [];
    for (var lineIndex in allTextEditorLines) {
        data.push(removeHTML(allTextEditorLines[lineIndex]));
    }
    if (all_users[myUserId - 1].perms.is_owner) {
        socket.emit('save-file', fileName, data);
    }
});
socket.on('send-directory-dict', function(dir_dict) {
    console.log('Recieved send-directory-dict');
    // var node = {
    //     dirs: [nodes],
    //     current_dir: '',
    //     files: []
    // };
    function makeHTMLForNode (node) {
        var nodeHTML = '<div class="dir">';
        nodeHTML += '<div class="dir-name">' +node.current_dir+ '</div>';

        nodeHTML += '<div class="dir-contents">';
        for (var i = 0; i < node.dirs.length; ++i) {
            nodeHTML += makeHTMLForNode(node.dirs[i]);
        }
        for (var j = 0; j < node.files.length; ++j) {
            nodeHTML += '<div class="file">' +node.files[j]+ '</div>';
        }
        nodeHTML += '</div>';

        nodeHTML += '</div>';
        return nodeHTML;
    }

    var allHTML = makeHTMLForNode(dir_dict);
    console.log(allHTML);
    $('#project-tree').html(allHTML);

    $('#project-tree .dir-contents').hide();
    $('#project-tree > .dir > .dir-contents').show();
    $('#project-tree .dir-name').click(function(){
        // $(this).next().slideToggle('slow', 'linear');
        $(this).next().toggle();
    });

    $('#project-tree .dir .file').click(function(){
        var project_dir_name = $('#project-tree > .dir > .dir-name').text();
        console.log(project_dir_name);
        var parent_node = $(this).parent().prev();
        var parent_name = parent_node.text();
        var path = [parent_name, $(this).text()];
        while (parent_name != project_dir_name) {
            console.log(parent_name);
            parent_node = parent_node.parent().parent().prev();
            parent_name = parent_node.text();
            path.unshift(parent_name);
        }
        console.log(path);
        socket.emit('set-file-path', path);
    });
});
socket.on('get-output-from-console', function(inputString, consoleOutput) {
    console.log('Recieved get-output-from-console');
    console.log(inputString, consoleOutput);
    var html = Prism.highlight(inputString, Prism.languages.python);
    // $('#console').append('<div><b>Input:</b><pre>'+html+'</pre>' + '<div><b>Output: </b>'+consoleOutput+'</div></div>');
    $('#console').append('<div><pre>'+html+'</pre>' + '<div>'+consoleOutput+'</div></div>');
});
socket.on('set-html-tag', function(htmlTag, attributes) {
    console.log('Recieved set-html-tag');
    console.log(htmlTag, attributes);
    for (var user in all_users) {
        if (all_users[user].perms.is_owner) {
            addHTMLAroundCursor('<span class="cursor cursor-'+all_users[user].index+'"></span>', htmlTag, attributes);
        }
    }
});
$('#eval-button').click(function(){
//$('#console-input').keypress(function(event){
    // if (event.which == 13) {
        var inputString = $('#console-input').val();
        console.log(inputString);
        socket.emit('send-to-console', inputString);
        $('#console-input').val('');
    // }
});



function writeAllLinesToDOM() {
    var allText = '';
    for (var i = 0; i < allTextEditorLines.length; ++i) {
        // var html = Prism.highlight(allTextEditorLines[i], Prism.languages.python);
        // allText += '<div>'+html+'</div>';
        allText += '<div>'+allTextEditorLines[i]+'</div>';
    }
    $('#text-editor').html(allText);
}
function writeOneLineToDOM(lineIndex, newText) {
    // var html = Prism.highlight(newText, Prism.languages.python);
    if (lineIndex >= allTextEditorLines.length) {
        allTextEditorLines.push(newText);
        $('#text-editor').append('<div>'+newText+'</div>');
    } else {
        var lineSpan = $('#text-editor div:nth-child('+(lineIndex+1)+')');
        allTextEditorLines[lineIndex] = newText;
        // lineSpan.html(html);
        lineSpan.html(newText);
    }
}
function removeHTML(text) {
    var newText = '';
    var isHTML = false;
    for (var i = 0; i < text.length; ++i) {
        if (isHTML || text[i] == '<') {
            isHTML = true;
        }
        if (!isHTML) {
            newText += text[i];
        }
        if (isHTML && text[i] == '>') {
            isHTML = false;
        }
    }
    return newText;
}
function isInArray(value, array) {
    return array.indexOf(value) > -1;
}
function removeAllCursors(text) {
    return text.replace(/<span class="cursor [^>]*><\/span>/ig, '');
}
function removeCursor (cursorHTML) {
    var cursorIndex = cursorOnLines[cursorHTML][1];
    var cursorLine = cursorOnLines[cursorHTML][0];
    var text = allTextEditorLines[cursorLine];

    var cursorIndexHTML = text.search(cursorHTML);
    var newText = text;
    if (cursorIndexHTML >= 0) {
        newText = text.slice(0, cursorIndexHTML) + text.slice(cursorIndexHTML + cursorHTML.length);
    }
    return newText;
}
function changeCursorPosition(newLineNumber, newCursorIndex, cursorHTML) {
    var oldLineNumber = cursorOnLines[cursorHTML][0];
    var oldCursorIndex = cursorOnLines[cursorHTML][1];
    var newOldText = removeCursor(cursorHTML);

    if (newLineNumber >= allTextEditorLines.length) {
        newLineNumber = allTextEditorLines.length - 1;
    } else if (newLineNumber <= 0) {
        newLineNumber = 0;
    }

    var text = '';
    if (newLineNumber == oldLineNumber) {
        text = newOldText;
    } else {
        text = allTextEditorLines[newLineNumber];
    }

    var newText = '';
    if (newCursorIndex <= 0) {
        newText = cursorHTML + text;
        newCursorIndex = 0;
    } else if (newCursorIndex >= removeHTML(text).length) {
        newText = text + cursorHTML;
        newCursorIndex = removeHTML(text).length;
    } else {
        var isHTML = false, countIndex = 0, i = 0;
        for (i = 0; i < text.length; ++i) {
            if (isHTML || text[i] == '<') {
                isHTML = true;
            }
            if (!isHTML) {
                if (countIndex == newCursorIndex) {
                    newText += cursorHTML;
                }
                countIndex += 1;
            }
            if (isHTML && text[i] == '>') {
                isHTML = false;
            }
            newText += text[i];
        }
        if (newCursorIndex >= i) {
            newText = text + cursorHTML;
            newCursorIndex = i;
        }
    }
    cursorOnLines[cursorHTML][0] = newLineNumber;
    cursorOnLines[cursorHTML][1] = newCursorIndex;
    writeOneLineToDOM(newLineNumber, newText);
    if (newLineNumber != oldLineNumber) {
        writeOneLineToDOM(oldLineNumber, newOldText);
    }
    //console.log(cursorOnLines[cursorHTML]);
}
function addHTMLAroundCursor(cursorHTML, HTMLTag, tagAttributes) {
    if (tagAttributes === undefined) {
        tagAttributes = '';
    }
    var lineNumber = cursorOnLines[cursorHTML][0];
    var text = allTextEditorLines[lineNumber];
    var cursorIndex = text.search(cursorHTML);
    var newText = text.slice(0, cursorIndex) + '<'+HTMLTag+tagAttributes+'>' + cursorHTML + '</'+HTMLTag+'>' + text.slice(cursorIndex + cursorHTML.length);
    // console.log(newText);
    writeOneLineToDOM(lineNumber, newText);
    $('#text-editor').focus();
}
function addHTMLToLine(lineNumber, HTMLTag, tagAttributes) {
    if (tagAttributes === undefined) {
        tagAttributes = '';
    }
    var text = allTextEditorLines[lineNumber];
    var newText = '<'+HTMLTag+' '+tagAttributes+'>' + text + '</'+HTMLTag+'>';
    // console.log(newText);
    writeOneLineToDOM(lineNumber, newText);
}
function addHTMLAt(lineNumber, startLineIndex, endLineIndex, HTMLTag, tagAttributes) {
    if (tagAttributes === undefined) {
        tagAttributes = '';
    }
    if (startLineIndex != endLineIndex) {
        if (endLineIndex < startLineIndex) {
            var temp = endLineIndex;
            endLineIndex = startLineIndex;
            startLineIndex = temp;
        }
        if (startLineIndex < endLineIndex) {
            var text = allTextEditorLines[lineNumber];
            var newText = '';
            var isHTML = false, countIndex = 0, i = 0;
            for (i = 0; i < text.length; ++i) {
                if (isHTML || text[i] == '<') {
                    isHTML = true;
                }
                if (!isHTML) {
                    if (countIndex == startLineIndex) {
                        newText += '<'+HTMLTag+' '+tagAttributes+'>';
                    }
                    if (countIndex == endLineIndex) {
                        newText += '</'+HTMLTag+'>';
                    }
                    countIndex += 1;
                }
                if (isHTML && text[i] == '>') {
                    isHTML = false;
                }
                newText += text[i];
            }
        }
        // console.log(newText);
        writeOneLineToDOM(lineNumber, newText);
    }
}
function removeHTMLFrom(startCoords, endCoords) {
    var line = allTextEditorLines[startCoords.posY];
    // console.log(line.slice(startCoords.posX, endCoords.posX));
}
function placeBeforeCursor(cursorHTML, newString) {
    var cursorLine = cursorOnLines[cursorHTML][0];
    var text = allTextEditorLines[cursorLine];

    var newText = '';
    var cursorIndexHTML = text.search(cursorHTML);
    for (var i = 0; i < text.length; ++i) {
        if (i >= cursorIndexHTML) {
            newText += newString;
            cursorOnLines[cursorHTML][1] += newString.length;
            break;
        }
        newText += text[i];
    }
    newText += text.slice(i);
    writeOneLineToDOM(cursorLine, newText);
}
function handleKey(key, cursorHTML) {
    if (key == 37) {
        // LEFT
        changeCursorPosition(cursorOnLines[cursorHTML][0], cursorOnLines[cursorHTML][1] - 1, cursorHTML);
    } else if (key == 38) {
        // UP
        changeCursorPosition(cursorOnLines[cursorHTML][0] - 1, cursorOnLines[cursorHTML][1], cursorHTML);
    } else if (key == 39) {
        // RIGHT
        changeCursorPosition(cursorOnLines[cursorHTML][0], cursorOnLines[cursorHTML][1] + 1, cursorHTML);
    } else if (key == 40) {
        // DOWN
        changeCursorPosition(cursorOnLines[cursorHTML][0] + 1, cursorOnLines[cursorHTML][1], cursorHTML);
    } else if (key == 13) {
        // ENTER
        var text = allTextEditorLines[cursorOnLines[cursorHTML][0]];
        var cursorIndexHTML = text.search(cursorHTML);
        var prevlineText = text.slice(0, cursorIndexHTML);
        var nextLineText = text.slice(cursorIndexHTML);

        var nltCursorsRemoved = removeAllCursors(nextLineText);
        var pltCursorsRemoved = removeAllCursors(prevlineText);
        var HTMLTagsRight = nltCursorsRemoved.match(/<[A-Za-z/]+[^>]*>/g);
        var HTMLTagsLeft = pltCursorsRemoved.match(/<[A-Za-z/]+[^>]*>/g);
        // var HTMLEndTagsArray = nltCursorsRemoved.match(/<\/[A-Za-z]+>/g);
        // var HTMLStartTagsArray = pltCursorsRemoved.match(/<[A-Za-z]+[^>]*>/g);
        // console.log(nextLineText, nltCursorsRemoved, HTMLTagsRight);
        // console.log(pltCursorsRemoved, HTMLTagsLeft);

        var isPair = 0;
        var HTMLEndTagsArray = [];
        if (HTMLTagsRight == null) {
            HTMLTagsRight = [];
        }
        for (var i = 0; i < HTMLTagsRight.length; ++i) {
            if (HTMLTagsRight[i][1] != '/') {
                isPair += 1;
            }
            if (!isPair) {
                HTMLEndTagsArray.push(HTMLTagsRight[i]);
            }
            if ((HTMLTagsRight[i][1] == '/') && isPair > 0) {
                isPair -= 1;
            }
        }
        var HTMLStartTagsArray = [];
        isPair = 0;
        if (HTMLTagsLeft == null) {
            HTMLTagsLeft = [];
        }
        for (var j = HTMLTagsLeft.length - 1; j >= 0; --j) {
            if (HTMLTagsLeft[j][1] == '/') {
                isPair += 1;
            }
            if (!isPair) {
                HTMLStartTagsArray.push(HTMLTagsLeft[j]);
            }
            if ((HTMLTagsLeft[j][1] != '/') && isPair > 0) {
                isPair -= 1;
            }
        }


        writeOneLineToDOM(cursorOnLines[cursorHTML][0], prevlineText + HTMLEndTagsArray.join(''));
        allTextEditorLines.splice(cursorOnLines[cursorHTML][0] + 1, 0, HTMLStartTagsArray.join('') + nextLineText + HTMLEndTagsArray.join(''));
        var lineSpan = $('#text-editor div:nth-child('+(cursorOnLines[cursorHTML][0]+1)+')');
        lineSpan.after('<div>'+HTMLStartTagsArray.join('') + nextLineText + HTMLEndTagsArray.join('') +'</div>');

        // cursorOnLines[cursorHTML][0] += 1;
        cursorOnLines[cursorHTML][1] = 0;
        for (var cur in cursorOnLines) {
            if (cursorOnLines[cur][0] >= cursorOnLines[cursorHTML][0]) {
                cursorOnLines[cur][0] += 1;
            }
        }
    } else if (key == 8) {
        // BACKSPACE
        var cursorIndex = cursorOnLines[cursorHTML][1];
        text = allTextEditorLines[cursorOnLines[cursorHTML][0]];
        var newText = '';
        if (cursorIndex > 0) {
            var isHTML = false, countIndex = 0, i = 0;
            for (i = 0; i < text.length; ++i) {
                if (isHTML || text[i] == '<') {
                    isHTML = true;
                }
                if (!isHTML) {
                    if (countIndex == cursorIndex - 1) {
                        newText += '';
                    } else {
                        newText += text[i];
                    }
                    countIndex += 1;
                } else {
                    newText += text[i];
                }
                if (isHTML && text[i] == '>') {
                    isHTML = false;
                }
            }
            writeOneLineToDOM(cursorOnLines[cursorHTML][0], newText);
            cursorOnLines[cursorHTML][1] -= 1;
        } else {
            if (cursorOnLines[cursorHTML][0] > 0) {
                var oldLineText = allTextEditorLines.splice(cursorOnLines[cursorHTML][0], 1);
                cursorOnLines[cursorHTML][0] -= 1;
                cursorOnLines[cursorHTML][1] = removeHTML(allTextEditorLines[cursorOnLines[cursorHTML][0]]).length;
                newText = allTextEditorLines[cursorOnLines[cursorHTML][0]] + oldLineText;
                writeOneLineToDOM(cursorOnLines[cursorHTML][0], newText);
                $('#text-editor div:nth-child('+(cursorOnLines[cursorHTML][0] + 2)+')').remove();

                for (var curs in cursorOnLines) {
                    if (cursorOnLines[curs][0] > cursorOnLines[cursorHTML][0]) {
                        cursorOnLines[curs][0] -= 1;
                    }
                }
            }
        }
    } else if (key == 32) {
        // SPACE
        placeBeforeCursor(cursorHTML, ' ');
    } else if (key == 46) {
        // DELETE
        cursorIndex = cursorOnLines[cursorHTML][1];
        text = allTextEditorLines[cursorOnLines[cursorHTML][0]];
        newText = '';
        if (cursorIndex < removeHTML(text).length) {
            isHTML = false; countIndex = 0; i = 0;
            for (i = 0; i < text.length; ++i) {
                if (isHTML || text[i] == '<') {
                    isHTML = true;
                }
                if (!isHTML) {
                    if (countIndex == cursorIndex) {
                        newText += '';
                    } else {
                        newText += text[i];
                    }
                    countIndex += 1;
                } else {
                    newText += text[i];
                }
                if (isHTML && text[i] == '>') {
                    isHTML = false;
                }
            }
            writeOneLineToDOM(cursorOnLines[cursorHTML][0], newText);
        } else {
            if (cursorOnLines[cursorHTML][0] < allTextEditorLines.length) {
                oldLineText = allTextEditorLines.splice(cursorOnLines[cursorHTML][0] + 1, 1);
                newText = allTextEditorLines[cursorOnLines[cursorHTML][0]] + oldLineText;
                writeOneLineToDOM(cursorOnLines[cursorHTML][0], newText);
                $('#text-editor div:nth-child('+(cursorOnLines[cursorHTML][0] + 2)+')').remove();

                for (var cu in cursorOnLines) {
                    if (cursorOnLines[cu][0] > cursorOnLines[cursorHTML][0]) {
                        cursorOnLines[cu][0] -= 1;
                    }
                }
            }
        }
    } else if (key == 35) {
        // END
        text = allTextEditorLines[cursorOnLines[cursorHTML][0]];
        changeCursorPosition(cursorOnLines[cursorHTML][0], removeHTML(text).length, cursorHTML);
    } else if (key == 36) {
        // HOME
        changeCursorPosition(cursorOnLines[cursorHTML][0], 0, cursorHTML);
    }

    /*
    var cursorLineIndex = cursorOnLines[cursorHTML][0];
    if (newText.length > 0) {
        writeOneLineToDOM(cursorLineIndex, newText);
    } else {
    }
*/
}

function getCursorIntoView () {
    var cursorElem = document.getElementsByClassName('cursor-'+myUserId)[0];
    if(!isScrolledIntoView(cursorElem)) {
        cursorElem.scrollIntoView();
    }
}

$('#text-editor').keypress(function(event){
    var character = event.which;
    // console.log("KEYPRESS: " + character);
    /*
    if (character == 118) {
        $('html').append('<textarea id="pasteBox"></textarea>');
        $('#pasteBox').focus();
        var pasteValue = '';
        setTimeout(function(){
            pasteValue = $('#pasteBox').val();
            $('#pasteBox').remove();
            console.log(pasteValue);
            placeBeforeCursor(userCursorHTML, pasteValue);
            socket.emit('update-key-press', pasteValue, userCursorHTML);
            $('#text-editor').focus();
        }, 100);
    } else 
    */
    if (!isInArray(character, [0,13,32,8,17,18])) {
        if (all_users[myUserId - 1].perms.is_writable && !all_users[myUserId - 1].perms.is_blocked) {
            placeBeforeCursor(userCursorHTML, String.fromCharCode(character));
            socket.emit('update-key-press', character, userCursorHTML);
            getCursorIntoView();
        }
    }
});
$('#text-editor').keydown(function(event){
    var key = event.which;
    // console.log("KEYDOWN: " + key);
    if (isInArray(key, [37,38,39,40, 8,13,32,46,36,35])) {
        if (!all_users[myUserId - 1].perms.is_blocked) {
            handleKey(key, userCursorHTML);
            socket.emit('update-key-down', key, userCursorHTML);
            getCursorIntoView();
        }
    }
});
$('#text-editor-wrapper').keydown(function(event){
    var key = event.which;
    if (isInArray(key, [37,38,39,40, 32])) {
        event.preventDefault();
    }
});
$('#text-editor-wrapper').click(function(event){
    $('#text-editor').focus();
});
$('#console-panel').click(function(event){
    $('#console-input').focus();
});
function getMouseXY(event) {
    var FONT_HEIGHT = 24, FONT_WIDTH = 15;
    var textEditor = $('#text-editor');

    var posX = event.pageX - textEditor.offset().left;
    var posY = event.pageY - textEditor.offset().top;
    posY = Math.floor(posY / FONT_HEIGHT);
    if (posY >= allTextEditorLines.length) {
        posY = allTextEditorLines.length - 1;
    } else if (posY < 0) {
        posY = 0;
    }
    var clickedLine = removeHTML(allTextEditorLines[posY]);
    posX = Math.floor(posX / FONT_WIDTH);
    if (posX >= clickedLine.length) {
        posX = clickedLine.length;
    } else if (posX < 0) {
        posX = 0;
    }
    return {posX: posX, posY: posY};
}
var globalStartMouseCoords = {};
var isDraggin = false;
var globalTextSelected = false;
$('#text-editor').mousedown(function(event){
    if (globalTextSelected) {
        removeHTMLFrom(globalStartMouseCoords, globalEndMouseCoords);
    }

    var startMouseCoords = getMouseXY(event);
    globalStartMouseCoords = startMouseCoords;
    isDraggin = true;

    var sposX = startMouseCoords.posX;
    var sposY = startMouseCoords.posY;
    console.log(startMouseCoords);
});
var globalEndMouseCoords = {};
$('#text-editor').mouseup(function(event){
    var endMouseCoords = getMouseXY(event);
    globalEndMouseCoords = endMouseCoords;
    isDraggin = false;

    var eposX = endMouseCoords.posX;
    var eposY = endMouseCoords.posY;
    console.log(endMouseCoords);

    if (eposX == globalStartMouseCoords.posX && eposY == globalStartMouseCoords.posY) {
        // It was a click
        socket.emit('update-click', eposX, eposY, userCursorHTML);
        changeCursorPosition(eposY, eposX, userCursorHTML);
    } else {
        // It must be a selection
        // console.log(getSelectionText());
        // var sposX = globalStartMouseCoords.posX;
        // var sposY = globalStartMouseCoords.posY;
        // addHTMLAt(sposY, sposX+1, eposX+1, 'span', 'class="selection-box"');
        // socket.emit('update-click', eposX, eposY, userCursorHTML);
        // changeCursorPosition(eposY, eposX, userCursorHTML);
        // globalTextSelected = true;
    }
});
$('#text-editor').mousemove(function(event){
    if (isDraggin) {
        var mouseCoords = getMouseXY(event);
        console.log(mouseCoords);
    }
});

function setUsername () {
    var preSelectedUsernames = ['Python', 'Ruby', 'JavaScript', 'Perl', 'Prolog', 'C++'];
    var randomIndex = Math.floor(Math.random() * preSelectedUsernames.length);
    var username = prompt('Please enter a username:', preSelectedUsernames[randomIndex]);
    return username;
}

writeAllLinesToDOM();

/*
function editText(cursorHTML, left, add, newString) {
    var cursorIndex = cursorOnLines[cursorHTML][1];
    var cursorLine = cursorOnLines[cursorHTML][0];
    var lineText = allTextEditorLines[cursorLine];
    var newText = '', i = 0;
    var isHTML = false;
    var charCount = 0;
    if (left) {
        if (cursorIndex <= 0) {
            newText = newString + lineText;
            cursorOnLines[cursorHTML][1] += 1;
        } else {
            newText = lineText.slice(cursorIndex);
            for (i = cursorIndex - 1; i > 0 && charCount < 1; --i) {
                if (isHTML || lineText[i] == '>') {
                    isHTML = true;
                }
                if (!isHTML) {
                    charCount += 1;
                    if (add) {
                        newText = lineText[i] + newString + newText;
                        cursorOnLines[cursorHTML][1] += 1;
                    } else {
                        newText = newString + newText;
                    }
                } else {
                    newText = lineText[i] + newText;
                }
                if (isHTML && lineText[i] == '<') {
                    isHTML = false;
                }
            }
            newText = lineText.slice(0,i) + newText;
        }
    } else {
        newText = lineText.slice(0, cursorIndex + cursorHTML.length);
        for (i = cursorIndex + cursorHTML.length; i <= lineText.length && charCount < 1; ++i) {
            if (isHTML || lineText[i] == '<') {
                isHTML = true;
            }
            if (!isHTML) {
                charCount += 1;
                if (add) {
                    newText += lineText[i] + newString;
                } else {
                    newText += newString;
                }
            } else {
                newText += lineText[i];
            }
            if (isHTML && lineText[i] == '>') {
                isHTML = false;
            }
        }
        newText += lineText.slice(i);
    }
    writeOneLineToDOM(cursorLine, newText);
    return newText;
}
*/
/*
  function funcEdit (cursorHTML, func) {
  var cursorIndex = cursorOnLines[cursorHTML][1];
  var cursorLine = cursorOnLines[cursorHTML][0];
  var text = allTextEditorLines[cursorLine];

  var isHTML = false, i = 0;
  var countIndex = 0, newText = '';
  for (i = 0; i < text.length; ++i) {
  if (isHTML || text[i] == '<') {
  isHTML = true;
  }
  if (!isHTML) {
  newText += func(countIndex, newText);
  countIndex += 1;
  }
  if (isHTML && text[i] == '>') {
  isHTML = false;
  }
  newText += text[i];
  }
  newText += text.slice(i);
  writeOneLineToDOM(cursorLine, newText);
  return newText;
  }
var addString = function (ci, newText) {
if (ci == cursorOnLines[cursorHTML][1]) {
return newText + inputString;
}
return '';
};
//funcEdit(cursorHTML, addString);
*/
