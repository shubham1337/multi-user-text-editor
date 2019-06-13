import sys
from PyQt4.QtGui import QApplication, QMainWindow, QAction
from PyQt4.QtCore import QUrl
from PyQt4.QtWebKit import QWebView


def main():
    qapp = QApplication(sys.argv)
    window = QMainWindow()
    view = QWebView()
    window.setWindowTitle('MUTE - Collaborative Text Editor')
    extractAction = QAction("&Exit", window)
    # extractAction.setShortcut("Ctrl+Q")
    extractAction.setStatusTip('Leave The App')
    extractAction.triggered.connect(sys.exit)
    mainMenu = window.menuBar()
    fileMenu = mainMenu.addMenu('&File')
    fileMenu.addAction(extractAction)
    view.load(QUrl('http://127.0.0.1:8000/index.html'))
    # view.setHtml('<h1>hi</h1>')
    window.setCentralWidget(view)
    window.showMaximized()
    # view.show()
    qapp.exec_()

main()
