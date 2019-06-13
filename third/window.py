import sys
from PyQt4.QtGui import QApplication, QMainWindow, QAction, QFileDialog, QInputDialog
from PyQt4.QtCore import QUrl
from PyQt4.QtWebKit import QWebView


def main():
    qapp = QApplication(sys.argv)
    window = QMainWindow()
    view = QWebView()
    window.setWindowTitle('MUTE - Collaborative Text Editor')

    def file_save():
        name = QFileDialog.getSaveFileName(window, 'Save File')
        if len(name.strip()) > 0:
            print('SAVE|' + name)
            sys.stdout.flush()

    def file_open():
        name = QFileDialog.getOpenFileName(window, 'Open File')
        if len(name.strip()) > 0:
            print('OPEN|' + name)
            sys.stdout.flush()

    def dir_open():
        dir_name = QFileDialog.getExistingDirectory(window, 'Open Directory', 'C:\\', QFileDialog.ShowDirsOnly)
        if len(name.strip()) > 0:
            print('DIR|' + dir_name)
            sys.stdout.flush()

    def set_console():
        name = QFileDialog.getOpenFileName(window, 'Set Console')
        if len(name.strip()) > 0:
            print('SCONSOLE|' + name)
            sys.stdout.flush()


    extractAction = QAction("&Exit", window)
    extractAction.setStatusTip('Leave The App')
    extractAction.triggered.connect(sys.exit)

    extractAction2 = QAction("&Open File", window)
    extractAction2.setStatusTip('Open a file')
    extractAction2.triggered.connect(file_open)

    extractAction4 = QAction("&Save File", window)
    extractAction4.setStatusTip('Save a file')
    extractAction4.triggered.connect(file_save)

    extractAction5 = QAction("&Set Console", window)
    extractAction5.triggered.connect(set_console)

    extractAction3 = QAction("&Open Project Directory", window)
    extractAction3.setStatusTip('Open a directory')
    extractAction3.triggered.connect(dir_open)


    mainMenu = window.menuBar()
    fileMenu = mainMenu.addMenu('&File')
    fileMenu.addAction(extractAction)
    fileMenu.addAction(extractAction2)
    fileMenu.addAction(extractAction4)
    fileMenu.addAction(extractAction3)
    fileMenu.addAction(extractAction5)

    def set_bold():
        print('SET_BOLD|', end='\n', file=sys.stdout, flush=True)
        # sys.stdout.flush()
    def set_italics():
        print('SET_ITALICS|')
        sys.stdout.flush()
    def set_html_tag():
        text, ok = QInputDialog.getText(window, 'Text Input Dialog', 'Enter HTML Tag:')
        if ok:
            textArray = text.strip().split()
            name = textArray[0]
            attributes = ' '.join(textArray[1:])
            print('SET_HTML_TAG|' + str(name) + '|' + attributes)
            sys.stdout.flush()

    boldAction = QAction("&Set Bold", window)
    boldAction.triggered.connect(set_bold)
    italicsAction = QAction("&Set Italics", window)
    italicsAction.triggered.connect(set_italics)
    htmlTagAction = QAction("&Set Html Tag", window)
    htmlTagAction.triggered.connect(set_html_tag)

    editMenu = mainMenu.addMenu('&Edit')
    editMenu.addAction(boldAction)
    editMenu.addAction(italicsAction)
    editMenu.addAction(htmlTagAction)


    view.load(QUrl('http://127.0.0.1:8000/index.html'))
    #view.page().mainFrame().evaluateJavaScript('var IS_ADMIN = true;')
    # view.setHtml('<h1>hi</h1>')
    window.setCentralWidget(view)
    window.showMaximized()
    view.show()
    qapp.exec_()

main()
