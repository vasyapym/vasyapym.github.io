@echo off
rem bytecheck launcher for Windows: resolves bytecheck.py beside this file, forces UTF-8 I/O,
rem picks an interpreter (py -3, then python3, then python; the Microsoft Store stub is skipped)
rem and forwards every argument. Untested on the authoring host: run "bytecheck.cmd --version" first.
setlocal
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
set "BYTECHECK_PY=%~dp0bytecheck.py"
set "BYTECHECK_EXE="
where py >nul 2>&1 && set "BYTECHECK_EXE=py -3"
if not defined BYTECHECK_EXE for /f "delims=" %%P in ('where python3 python 2^>nul') do if not defined BYTECHECK_EXE if /i not "%%~dpP"=="%LOCALAPPDATA%\Microsoft\WindowsApps\" set "BYTECHECK_EXE="%%P""
if not defined BYTECHECK_EXE echo bytecheck.cmd: no Python 3 found - tried py -3, python3, python 1>&2 & exit /b 2
%BYTECHECK_EXE% "%BYTECHECK_PY%" %*
exit /b %ERRORLEVEL%
