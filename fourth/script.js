


var userCursorHTML = '<span class="cursor cursor-1"></span>';
var allTextEditorLines = ['<b>'+userCursorHTML+'</b>initial <b>cond</b>ition','new <b></b>line'];
var cursorOnLines = {};
cursorOnLines[userCursorHTML] = [0,3];
var userId = 0;
var rcvdData = false;


/*
var socket = io.connect('http://'+window.location.hostname+':8080/');
socket.on('connect', function() {
    console.log('SocketIO Connected to: http://'+window.location.hostname+':8080/');
});
socket.on('user-id', function(total) {
    console.log(total);
    userId = total;
});
socket.on('get-data-package', function() {
    if (userId == 1) {
        var data = {
            allTextEditorLines: allTextEditorLines,
            cursorOnLines: cursorOnLines
        };
        socket.emit('get-data-package', data);
    }
});
socket.on('initial-data-package', function(data) {
    if (!rcvdData && userId > 1) {
        console.log(data);
        userCursorHTML = '<span class="cursor cursor-'+userId+'"></span>';
        allTextEditorLines = Array.prototype.concat(data.allTextEditorLines);
        cursorOnLines = data.cursorOnLines;
        cursorOnLines[userCursorHTML] = [0,0];
        allTextEditorLines[0] = userCursorHTML + allTextEditorLines[0];
        writeAllLinesToDOM();
        rcvdData = true;
    }
});
socket.on('chat-message', function(msg) {
    document.getElementById('message-box').innerHTML += msg + '<br><hr><br>';
});
function send_message() {
    socket.emit('chat-message', document.getElementById('message-input').value);
    document.getElementById('message-input').value = '';
}
socket.on('update-key-down', function(key, cursorIndex, cursorHTML) {
    console.log(key, cursorIndex, cursorHTML);
    if (cursorHTML != userCursorHTML) {
        var cursorLineIndex = cursorOnLines[cursorHTML][0];
        var text = allTextEditorLines[cursorLineIndex];
        handleKey(key, cursorIndex, cursorHTML, text);
    }
});
socket.on('update-key-press', function(character, cursorHTML) {
    console.log(character, cursorHTML);
    if (cursorHTML != userCursorHTML) {
        placeBeforeCursor(cursorHTML, String.fromCharCode(character));
    }
});
*/



function writeAllLinesToDOM() {
    allText = '';
    for (var i = 0; i < allTextEditorLines.length; ++i) {
        allText += '<span data-id="'+i+'">'+allTextEditorLines[i]+'</span>';
    }
    $('#text-editor').html(allText);
}
function writeOneLineToDOM(lineIndex, newText) {
    allTextEditorLines[lineIndex] = newText;
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
    return text.replace(/<span class="cursor.*><\/span>/ig, '');
}
function nextValidIndex (noOfChars, text) {
    var nextIndex = 0;
    var isHTML = false;
    var charCount = 0;
    text = removeAllCursors(text);
    for (var i = 0; i < text.length; ++i) {
        if ((isHTML || text[i] == '<')) {
            isHTML = true;
        }
        if (!isHTML) {
            if (charCount == noOfChars) {
                nextIndex = i;
                break;
            }
            charCount += 1;
        }
        if (isHTML && text[i] == '>') {
            isHTML = false;
        }
    }
    return nextIndex;
}
function changeCursorPosition(newLineNumber, newCursorIndex, cursorHTML) {
    var oldLineNumber = cursorOnLines[cursorHTML][0];
    var oldCursorIndex = cursorOnLines[cursorHTML][1];
    var oldText = allTextEditorLines[oldLineNumber];
    var newOldText = oldText.slice(0, oldCursorIndex) + oldText.slice(oldCursorIndex + cursorHTML.length);
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
        newCursorIndex = 0;
    }
    console.log(text);
    newText = text.slice(0, newCursorIndex) + cursorHTML + text.slice(newCursorIndex);
    cursorOnLines[cursorHTML][0] = newLineNumber;
    cursorOnLines[cursorHTML][1] = newCursorIndex;
    writeOneLineToDOM(newLineNumber, newText);
    if (newLineNumber != oldLineNumber) {
        writeOneLineToDOM(oldLineNumber, newOldText);
    }
}
function editText (cursorHTML, newString) {
    var cursorIndex = cursorOnLines[cursorHTML][1];
    var cursorLine = cursorOnLines[cursorHTML][0];
    var text = allTextEditorLines[cursorLine];

    var isHTML = false;
    var newText = '';
    for (var i = 0; i < text.length; ++i) {
        if ((isHTML || text[i] == '<')) {
            isHTML = true;
        }
        if (isHTML) {
            if (i == cursorIndex) {
                newText += newString;
                cursorOnLines[cursorHTML][1] += newString.length;
                i += newString.length;
                console.log(newText);
                break;
            }
        }
        if (isHTML && text[i] == '>') {
            isHTML = false;
        }
        newText += text[i];
    }
    newText += text.slice(i);
    writeOneLineToDOM(cursorLine, newText);
}
function addHTMLAroundCursor(cursorHTML, HTMLTag, tagAttributes) {
    if (tagAttributes === undefined) {
        tagAttributes = '';
    }
    var lineNumber = cursorOnLines[cursorHTML][0];
    var cursorIndex = cursorOnLines[cursorHTML][1];
    var text = allTextEditorLines[lineNumber];
    var newText = text.slice(0, cursorIndex) + '<'+HTMLTag+tagAttributes+'>' + cursorHTML + '</'+HTMLTag+'>' + text.slice(cursorIndex + cursorHTML.length);
    console.log(newText);
    writeOneLineToDOM(lineNumber, newText);
}
function placeBeforeCursor(cursorHTML, inputString) {
    editText(cursorHTML, inputString);
    /*
    var cursorLineIndex = cursorOnLines[cursorHTML][0];
    var text = allTextEditorLines[cursorLineIndex];
    var cursorIndex = cursorOnLines[cursorHTML][1];
    var newText = text.slice(0, cursorIndex) + inputString + cursorHTML + text.slice(cursorIndex + cursorHTML.length);
    allTextEditorLines[cursorLineIndex] = newText;
    writeOneLineToDOM(cursorLineIndex);
    cursorOnLines[cursorHTML][1] += inputString.length;
    */
}
function handleKey(key, cursorIndex, cursorHTML, text) {
    var oldCursorIndex = cursorOnLines[cursorHTML][1];
    if (cursorIndex != -1) {
        if (key == 37) {
            // LEFT
            changeCursorPosition(cursorOnLines[cursorHTML][0], nextValidIndex(oldCursorIndex - 1, text), cursorHTML);
        } else if (key == 38) {
            // UP
            changeCursorPosition(cursorOnLines[cursorHTML][0] - 1, nextValidIndex(oldCursorIndex, text), cursorHTML);
        } else if (key == 39) {
            // RIGHT
            changeCursorPosition(cursorOnLines[cursorHTML][0],  nextValidIndex(oldCursorIndex + 1, text), cursorHTML);
        } else if (key == 40) {
            // DOWN
            changeCursorPosition(cursorOnLines[cursorHTML][0] + 1, nextValidIndex(oldCursorIndex, text), cursorHTML);
        } else if (key == 13) {
            // ENTER
            allTextEditorLines.splice(cursorOnLines[cursorHTML][0] + 1, 0, cursorHTML);
            changeCursorPosition(cursorOnLines[cursorHTML][0] + 1, 0, cursorHTML);
            for (var i = cursorOnLines[cursorHTML][0] - 1; i < allTextEditorLines.length; ++i) {
                writeOneLineToDOM(i);
            }
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
            placeBeforeCursor(cursorHTML, ' ');
        } else if (key == 46) {
            // DELETE
            // editText(cursorHTML, false, false, '');
        } else if (key == 35) {
            // END
            changeCursorPosition(cursorOnLines[cursorHTML][0], text.length, cursorHTML);
        } else if (key == 36) {
            // HOME
            changeCursorPosition(cursorOnLines[cursorHTML][0], 0, cursorHTML);
        }
    }

    /*
    var cursorLineIndex = cursorOnLines[cursorHTML][0];
    if (newText.length > 0) {
        writeOneLineToDOM(cursorLineIndex, newText);
    } else {
        $('#text-editor span[data-id="'+cursorLineIndex+'"]').remove();
    }
*/
}

$('#text-editor').keypress(function(event){
    var character = event.which;
    //console.log("KEYPRESS: " + character);
    if (!isInArray(character, [0,13,32,8,17,18])) {
        placeBeforeCursor(userCursorHTML, String.fromCharCode(character));
        // socket.emit('update-key-press', character, userCursorHTML);
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
        // socket.emit('update-key-down', key, cursorIndex, userCursorHTML);
    }
});
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
