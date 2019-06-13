var userCursorHTML = '<span class="cursor cursor-0"></span>';
var globalCursorIndex = 0;
var netCursorSet = false;
var userId = 0;

//var socket = io.connect('http://' + document.domain + ':' + location.port);
var socket = io.connect('http://10.0.0.2:8080/');
socket.on('connect', function() {
    document.getElementById('has-connected').innerHTML = 'Connected!';
    socket.emit('get-text-update');
});
socket.on('text-update', function(text) {
    if (userId && userId > 1) {
        $('#text-editor').html(text);
        console.log('updated text from server');
    }
});
socket.on('get-text-update', function() {
    if (userId && userId == 1) {
        var html_text = $('#text-editor').html();
        if (html_text.length > 0) {
            socket.emit('text-update', html_text);
            console.log('sending text to server');
        }
    }
});
socket.on('total-connected', function(total) {
    document.getElementById('has-connected').innerHTML = total + ' client(s) connected!';
    if (!netCursorSet) {
        userId = total;
        userCursorHTML = '<span class="cursor cursor-' + userId + '"></span>';
        netCursorSet = true;
    }
    var text = $('#text-editor').html();
    var newText = '<span class="cursor cursor-' + total + '"></span>' + text;
    $('#text-editor').html(newText);
});
socket.on('chat-message', function(msg) {
    document.getElementById('message-box').innerHTML += msg + '<br><hr><br>';
});
function send_message() {
    socket.emit('chat-message', document.getElementById('message-input').value);
    document.getElementById('message-input').value = '';
}
setInterval(function(){
    /*
    socket.emit('cursor-update', {
        cursorHTML: userCursorHTML,
        cursorIndex: globalCursorIndex
    });
    */
    //var html_text = removeAllCursors($('#text-editor').html());
    //var html_text = $('#text-editor').html();
    //if (html_text.length > 0) {
        //socket.emit('text-update', html_text);
    //}
}, 5000);

// Cursors animation
/*
   var cbo = false, cba = null;
   $('#text-editor').click(function(){
   if (!cbo) {
   cba = setInterval(function(){ $('.cursor').toggle(); }, 400);
   cbo = true;
   } else {
   clearInterval(cba);
   cba = null;
   cbo = false;
   }
   });
   */
function isInArray(value, array) {
    return array.indexOf(value) > -1;
}
var allCursorPositions = []
function removeAllCursors(text) {
    //globalCursorIndex = text.search(userCursorHTML);
    /*var reg_cursors = new RegExp("<span class=\"cursor cursor-.*></span>");
    current_cursors = text.match(reg_cursors);
    if (current_cursors !== null) {
        for (var i = 0; i < current_cursors.length; ++i) {
            allCursorPositions.push({
                cursorHTML: current_cursors[i],
                cursorIndex: text.search(current_cursors[i])
            });
        }
    }*/

    return text.replace(/<span class="cursor .*><\/span>/ig, '');
}
function placeCursorAt(text, cursorIndex, cursorHTML) {
    var newText = text.slice(0, cursorIndex) + cursorHTML + text.slice(cursorIndex);
    return newText;
}
function putCursorsBack(text) {
    allCursorPositions.sort(function(a, b){
        return a.cursorIndex - b.cursorIndex;
    });
    var newText = text;
    for (var i = 0; i < allCursorPositions.length; ++i) {
        newText = placeCursorAt(newText, allCursorPositions[i].cursorIndex, allCursorPositions[i].cursorHTML);
    }
    return newText;
}
function placeBeforeCursor(cursorHTML, inputString) {
    var text = $('#text-editor').html();
    var cursorIndex = text.search(cursorHTML);
    text = removeAllCursors(text);
    var newText = text.slice(0, cursorIndex) + inputString + cursorHTML + text.slice(cursorIndex);
    $('#text-editor').html(newText);
    globalCursorIndex = text.search(cursorHTML);
}
function getAllSearchIndices(text, str) {
    var searchStrLen = str.length;
    var startIndex = 0, index, indices = [];
    while ((index = text.indexOf(str, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}
function handleKey(key, cursorIndex, cursorHTML, text) {
    var newText = text;
    var text = removeAllCursors(text);
    if (cursorIndex != -1) {
        if (key == 37) {
            // LEFT
            if (cursorIndex > 0) {
                var skipStep = 1;
                if (text.slice(cursorIndex - 4, cursorIndex) == '<br>') {
                    skipStep = 4;
                }
                newText = text.slice(0, cursorIndex - skipStep) + cursorHTML + text.slice(cursorIndex - skipStep, cursorIndex) + text.slice(cursorIndex);
            }
        } else if (key == 38) {
            // UP
            lineBreakIndices = getAllSearchIndices(text.slice(0, cursorIndex), '<br>');
            if (lineBreakIndices.length > 0) {
                lineBreakIndices.unshift(-4);
                lastLineBreakIndex = lineBreakIndices.slice(-1)[0];
                upperLineBreakIndex = lineBreakIndices.slice(-2,-1)[0];
                var newCursorIndex = upperLineBreakIndex + (cursorIndex - lastLineBreakIndex);
                if (newCursorIndex > lastLineBreakIndex) {
                    newCursorIndex = upperLineBreakIndex + 4;
                }
                newText = text.slice(0, newCursorIndex) + cursorHTML + text.slice(newCursorIndex, cursorIndex) + text.slice(cursorIndex);
            }
        } else if (key == 39) {
            // RIGHT
            var skipStep = 1;
            if (text.slice(cursorIndex, cursorIndex + 4) == '<br>') {
                skipStep = 4;
            }
            newText = text.slice(0, cursorIndex + skipStep) + cursorHTML + text.slice(cursorIndex + skipStep);
        } else if (key == 40) {
            // DOWN
            lineBreakIndices = getAllSearchIndices(text.slice(0, cursorIndex), '<br>');
            lineBreakIndices.unshift(-4);
            lastLineBreakIndex = lineBreakIndices.slice(-1)[0];
            lowerLineBreakIndex = text.indexOf('<br>', cursorIndex);
            if (lowerLineBreakIndex != -1) {
                var newCursorIndex = lowerLineBreakIndex + (cursorIndex - lastLineBreakIndex);
                nextLineBreakIndex = text.indexOf('<br>', lowerLineBreakIndex + 4);
                if (nextLineBreakIndex != -1 && newCursorIndex > nextLineBreakIndex) {
                    newCursorIndex = lowerLineBreakIndex + 4;
                }
                newText = text.slice(0, newCursorIndex) + cursorHTML + text.slice(newCursorIndex);
            }
        } else if (key == 13) {
            // ENTER
            newText = text.slice(0, cursorIndex) + '<br>' + cursorHTML + text.slice(cursorIndex);
        } else if (key == 8) {
            // BACKSPACE
            if (cursorIndex > 0) {
                var skipStep = 1;
                if (text.slice(cursorIndex - 4, cursorIndex) == '<br>') {
                    skipStep = 4;
                }
                newText = text.slice(0, cursorIndex - skipStep) + cursorHTML + text.slice(cursorIndex);
            }
        } else if (key == 32) {
            // SPACE
            newText = text.slice(0, cursorIndex) + ' ' + cursorHTML + text.slice(cursorIndex);
        }
    }

    globalCursorIndex = newText.search(cursorHTML);
    return newText;
}

$('#text-editor').keypress(function(event){
    var character = event.which;
    //console.log("KEYPRESS: " + character);
    if (!isInArray(character, [0,13,32,8,17,18])) {
        socket.emit('update-key-press', character, userCursorHTML);
        placeBeforeCursor(userCursorHTML, String.fromCharCode(character));
    }
});
$('#text-editor').keydown(function(event){
    var key = event.which;
    //console.log("KEYDOWN: " + key);
    if (isInArray(key, [37,38,39,40, 8,13,32])) {
        var text = $('#text-editor').html();
        var cursorIndex = text.search(userCursorHTML);
        globalCursorIndex = cursorIndex;
        socket.emit('update-key-down', key, cursorIndex, userCursorHTML);
        var newText = handleKey(key, cursorIndex, userCursorHTML, text);
        $('#text-editor').html(newText);
    }
});
socket.on('update-key-down', function(key, cursorIndex, cursorHTML) {
    if (cursorHTML != userCursorHTML) {
        var text = $('#text-editor').html();
        var newText = handleKey(key, cursorIndex, cursorHTML, text);
        $('#text-editor').html(newText);
    }
});
socket.on('update-key-press', function(character, cursorHTML) {
    if (cursorHTML != userCursorHTML) {
        placeBeforeCursor(cursorHTML, String.fromCharCode(character));
    }
});
socket.on('cursor-update', function(cursorPos) {
    cursorPos.sort(function(a, b){
        return a.cursorIndex - b.cursorIndex;
    });
    var text = $('#text-editor').html();
    newText = removeAllCursors(text);
    for (var i = 0; i < cursorPos.length; i++) {
        newText = placeCursorAt(newText, cursorPos[i].cursorIndex, cursorPos[i].cursorHTML);
    }
    $('#text-editor').html(newText);
    //var text = $('#text-editor').html();
    //var newText = handleKey(key, cursorIndex, cursorHTML, text);
    //$('#text-editor').html(newText);
});
