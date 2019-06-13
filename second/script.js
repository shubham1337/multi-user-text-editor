



var socket = io.connect('http://'+window.location.hostname+':8080/');
socket.on('connect', function() {
    console.log('SocketIO Connected to: http://'+window.location.hostname+':8080/');
    socket.on('chat-message', function(msg) {
        document.getElementById('message-box').innerHTML += msg + '<br><hr><br>';
    });
});
function send_message() {
    socket.emit('chat-message', document.getElementById('message-input').value);
    document.getElementById('message-input').value = '';
}



var userCursorHTML = '<span class="cursor cursor-1"></span>';
var allTextEditorLines = [userCursorHTML+'Hello amolo','new line'];
var cursorOnLines = {};
cursorOnLines[userCursorHTML] = [0,0];

function writeAllLinesToDOM() {
    allText = '';
    for (var i = 0; i < allTextEditorLines.length; ++i) {
        allText += '<span data-id="'+i+'">'+allTextEditorLines[i]+'</span>';
    }
    $('#text-editor').html(allText);
}
function writeOneLineToDOM(lineIndex) {
    var lineSpan = $('#text-editor span[data-id="'+lineIndex+'"]');
    if (lineSpan.length != 0) {
        lineSpan.html(allTextEditorLines[lineIndex]);
    } else {
        $('#text-editor').append('<span data-id="'+lineIndex+'">'+allTextEditorLines[lineIndex]+'</span>');
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
    return text.replace(/<span class="cursor .*><\/span>/ig, '');
}
function changeCursorPosition(oldLineNumber, oldCursorIndex, newLineNumber, newCursorIndex, cursorHTML) {
    var oldText = allTextEditorLines[oldLineNumber];
    allTextEditorLines[oldLineNumber] = oldText.slice(0, oldCursorIndex) + oldText.slice(oldCursorIndex + cursorHTML.length);
    writeOneLineToDOM(oldLineNumber);
    if (newLineNumber >= allTextEditorLines.length) {
        newLineNumber = allTextEditorLines.length - 1;
    } else if (newLineNumber <= 0) {
        newLineNumber = 0;
    }
    var text = allTextEditorLines[newLineNumber];
    var newText = '';
    if (newCursorIndex <= 0) {
        newText = cursorHTML + text;
    } else {
        var isHTML = false;
        var countIndex = 0;
        var i = 0;
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
        }
    }
    cursorOnLines[cursorHTML][0] = newLineNumber;
    cursorOnLines[cursorHTML][1] = newCursorIndex;
    allTextEditorLines[newLineNumber] = newText;
    writeOneLineToDOM(newLineNumber);
}
function placeBeforeCursor(cursorHTML, inputString) {
    var cursorLineIndex = cursorOnLines[cursorHTML][0];
    var text = allTextEditorLines[cursorLineIndex];
    var cursorIndex = cursorOnLines[cursorHTML][1];
    var newText = text.slice(0, cursorIndex) + inputString + cursorHTML + text.slice(cursorIndex + cursorHTML.length);
    allTextEditorLines[cursorLineIndex] = newText;
    writeOneLineToDOM(cursorLineIndex);
    cursorOnLines[cursorHTML][1] += inputString.length;
}
function handleKey(key, cursorIndex, cursorHTML, text) {
    var newText = text;
    var text = removeHTML(text);
    if (cursorIndex != -1) {
        if (key == 37) {
            // LEFT
            if (cursorIndex > 0) {
                var skipStep = 1;
                if (text.slice(cursorIndex - 1, cursorIndex) == '>') {
                    var endCaretIndex = text.indexOf('<');
                    skipStep = cursorIndex - endCaretIndex + 1;
                }
                newText = text.slice(0, cursorIndex - skipStep) + cursorHTML + text.slice(cursorIndex - skipStep, cursorIndex) + text.slice(cursorIndex);
                cursorOnLines[cursorHTML][1] -= 1;
            } else {
                if (cursorOnLines[cursorHTML][0] > 0) {
                    cursorOnLines[cursorHTML][0] -= 1;
                    cursorOnLines[cursorHTML][1] = removeHTML(allTextEditorLines[cursorOnLines[cursorHTML][0]]).length;
                    allTextEditorLines[cursorOnLines[cursorHTML][0]] += cursorHTML;
                    writeOneLineToDOM(cursorOnLines[cursorHTML][0]);
                    newText = text;
                }
            }
        } else if (key == 38) {
            // UP
            if (cursorOnLines[cursorHTML][0] > 0) {
                cursorOnLines[cursorHTML][0] -= 1;
                var nextLineText = removeHTML(allTextEditorLines[cursorOnLines[cursorHTML][0]]);
                if (cursorIndex >= text.length && text.length > nextLineText.length) {
                    cursorOnLines[cursorHTML][1] = nextLineText.length;
                }
                allTextEditorLines[cursorOnLines[cursorHTML][0]] = placeCursorAt(nextLineText, cursorIndex, cursorHTML);
                writeOneLineToDOM(cursorOnLines[cursorHTML][0]);
                newText = text;
            }
        } else if (key == 39) {
            // RIGHT
            if (cursorIndex >= text.length) {
                if (cursorOnLines[cursorHTML][0] >= allTextEditorLines.length - 1) {
                    //allTextEditorLines.push(cursorHTML);
                    //writeOneLineToDOM(cursorOnLines[cursorHTML]);
                } else {
                    cursorOnLines[cursorHTML][0] += 1;
                    cursorOnLines[cursorHTML][1] = 0;
                    allTextEditorLines[cursorOnLines[cursorHTML][0]] = cursorHTML + allTextEditorLines[cursorOnLines[cursorHTML][0]];
                    writeOneLineToDOM(cursorOnLines[cursorHTML][0]);
                    newText = text;
                }
            } else {
                var skipStep = 1;
                if (text.slice(cursorIndex, cursorIndex + 1) == '<') {
                    var endCaretIndex = text.indexOf('>');
                    skipStep = endCaretIndex - cursorIndex + 2;
                }
                newText = text.slice(0, cursorIndex + skipStep) + cursorHTML + text.slice(cursorIndex + skipStep);
                cursorOnLines[cursorHTML][1] += 1;
            }
        } else if (key == 40) {
            // DOWN
            if (cursorOnLines[cursorHTML][0] < allTextEditorLines.length - 1) {
                cursorOnLines[cursorHTML][0] += 1;
                var nextLineText = removeHTML(allTextEditorLines[cursorOnLines[cursorHTML][0]]);
                if (cursorIndex >= text.length && text.length > nextLineText.length) {
                    cursorOnLines[cursorHTML][1] = nextLineText.length;
                }
                allTextEditorLines[cursorOnLines[cursorHTML][0]] = placeCursorAt(nextLineText, cursorIndex, cursorHTML);
                writeOneLineToDOM(cursorOnLines[cursorHTML][0]);
                newText = text;
            }
        } else if (key == 13) {
            // ENTER
            nextLineText = text.slice(cursorIndex);
            cursorOnLines[cursorHTML][0] += 1;
            cursorOnLines[cursorHTML][1] = 0;
            allTextEditorLines.splice(cursorOnLines[cursorHTML][0], 0, cursorHTML + nextLineText);
            for (var i = cursorOnLines[cursorHTML][0] - 1; i < allTextEditorLines.length; ++i) {
                writeOneLineToDOM(i);
            }
            newText = text.slice(0, cursorIndex);
        } else if (key == 8) {
            // BACKSPACE
            if (cursorIndex > 0) {
                var skipStep = 1;
                if (text.slice(cursorIndex - 1, cursorIndex) == '>') {
                    var endCaretIndex = text.indexOf('<');
                    skipStep = cursorIndex - endCaretIndex + 1;
                }
                newText = text.slice(0, cursorIndex - skipStep) + cursorHTML + text.slice(cursorIndex);
                cursorOnLines[cursorHTML][1] -= 1;
            } else {
                if (cursorOnLines[cursorHTML][0] > 0) {
                    allTextEditorLines.splice(cursorOnLines[cursorHTML][0], 1);
                    cursorOnLines[cursorHTML][0] -= 1;
                    cursorOnLines[cursorHTML][1] = removeHTML(allTextEditorLines[cursorOnLines[cursorHTML][0]]).length;
                    allTextEditorLines[cursorOnLines[cursorHTML][0]] += cursorHTML;
                    writeOneLineToDOM(cursorOnLines[cursorHTML][0]);
                    newText = text;
                }
            }
        } else if (key == 32) {
            // SPACE
            newText = text.slice(0, cursorIndex) + ' ' + cursorHTML + text.slice(cursorIndex);
            cursorOnLines[cursorHTML][1] += 1;
        } else if (key == 46) {
            // DELETE
            newText = text.slice(0, cursorIndex) + cursorHTML + text.slice(cursorIndex + 1);
        } else if (key == 35) {
            // END
            cursorOnLines[cursorHTML][1] = removeHTML(text).length;
            newText = text + cursorHTML;
        } else if (key == 36) {
            // HOME
            cursorOnLines[cursorHTML][1] = 0;
            newText = cursorHTML + text;
        }
    }

    var cursorLineIndex = cursorOnLines[cursorHTML][0];
    if (newText.length > 0) {
        allTextEditorLines[cursorLineIndex] = newText;
        writeOneLineToDOM(cursorLineIndex);
    } else {
        $('#text-editor span[data-id="'+cursorLineIndex+'"]').remove();
    }
}

$('#text-editor').keypress(function(event){
    var character = event.which;
    //console.log("KEYPRESS: " + character);
    if (!isInArray(character, [0,13,32,8,17,18])) {
        placeBeforeCursor(userCursorHTML, String.fromCharCode(character));
        console.log(cursorOnLines[userCursorHTML]);
    }
});
$('#text-editor').keydown(function(event){
    var key = event.which;
    //console.log("KEYDOWN: " + key);
    if (isInArray(key, [37,38,39,40, 8,13,32,46,36,35])) {
        var cursorLineIndex = cursorOnLines[userCursorHTML][0];
        var text = allTextEditorLines[cursorLineIndex];
        var cursorIndex = cursorOnLines[userCursorHTML][1];
        handleKey(key, cursorIndex, userCursorHTML, text);

        console.log(cursorOnLines[userCursorHTML]);
    }
});
writeAllLinesToDOM();
