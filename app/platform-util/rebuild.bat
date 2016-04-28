@echo on
call node-gyp rebuild --python=C:\Python27 --target=0.37.2 --arch=ia32 --dist-url=https://atom.io/download/atom-shell
copy /Y .\build\Release\addon.node .\win-ia32.node
call node-gyp rebuild --python=C:\Python27 --target=0.37.2 --arch=x64 --dist-url=https://atom.io/download/atom-shell
copy /Y .\build\Release\addon.node .\win-x64.node
