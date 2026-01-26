@REM Maven Wrapper script for Windows
@REM Downloads and runs Maven if not installed

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar
set MAVEN_WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties

@REM Check if Maven is installed
where mvn >nul 2>&1
if %ERRORLEVEL% == 0 (
    mvn %*
    goto end
)

@REM Download wrapper if needed
if not exist "%MAVEN_WRAPPER_JAR%" (
    echo Downloading Maven Wrapper...
    powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar' -OutFile '%MAVEN_WRAPPER_JAR%'"
)

@REM Use Java to run wrapper
java -jar "%MAVEN_WRAPPER_JAR%" %*

:end
endlocal
