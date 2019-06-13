# -*- mode: python -*-

block_cipher = None


a = Analysis(['app.py'],
             pathex=['c:\\Users\\rsharmaindia\\Downloads\\python-mute\\second'],
             binaries=[],
             datas=[],
             hiddenimports=[],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)

def Datafiles(*filenames, **kw):
    import os

    def datafile(path, strip_path=True):
        parts = path.split('/')
        path = name = os.path.join(*parts)
        if strip_path:
            name = os.path.basename(path)

        return name, path, 'DATA'

    strip_path = kw.get('strip_path', True)
    return TOC(
        datafile(filename, strip_path=strip_path)
        for filename in filenames
        if os.path.isfile(filename)
        )

static1 = Datafiles('index.html', strip_path=False)
static2 = Datafiles('script.js', strip_path=False)
static3 = Datafiles('jquery-3.2.1.slim.min.js', strip_path=False)
static4 = Datafiles('socket.io.min.js', strip_path=False)

pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          static1,
          static2,
          static3,
          static4,
          name='app',
          debug=False,
          strip=False,
          upx=True,
          runtime_tmpdir=None,
          console=False )
