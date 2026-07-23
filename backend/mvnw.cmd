@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM
@REM Required ENV vars:
@REM JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars
@REM M2_HOME - location of maven2's installed home dir
@REM MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the batch commands
@REM MAVEN_BATCH_PAUSE - set to 'on' to wait for a keystroke before ending
@REM MAVEN_OPTS - parameters passed to the Java VM when running Maven
@REM     e.g. to debug Maven itself, use
@REM set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
@REM MAVEN_SKIP_RC - flag to disable loading of mavenrc files
@REM ----------------------------------------------------------------------------

@IF "%MAVEN_BATCH_ECHO%" == "on"  @ECHO ON
@IF "%MAVEN_BATCH_ECHO%" == "" @ECHO OFF

@SETLOCAL

@SET ERROR_CODE=0

@REM To isolate internal variables from possible post scripts, we use another setlocal
@SETLOCAL

@REM ==== START VALIDATION ====
@IF NOT "%JAVA_HOME%" == "" @GOTO OkJHome

@ECHO.
@ECHO Error: JAVA_HOME not found in your environment. >&2
@ECHO Please set the JAVA_HOME variable in your environment to match the >&2
@ECHO location of your Java installation. >&2
@ECHO.
@GOTO error

:OkJHome
@IF EXIST "%JAVA_HOME%\bin\java.exe" @GOTO chkMHome

@ECHO.
@ECHO Error: JAVA_HOME is set to an invalid directory. >&2
@ECHO JAVA_HOME = "%JAVA_HOME%" >&2
@ECHO Please set the JAVA_HOME variable in your environment to match the >&2
@ECHO location of your Java installation. >&2
@ECHO.
@GOTO error

:chkMHome
@SET "MAVEN_PROJECTBASEDIR=%~dp0"
@SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

@SET "MAVEN_HOME=%~dp0.mvn\wrapper\maven-wrapper.jar"
@SET "MAVEN_CMD_LINE_ARGS=%*"

@ECHO Calling Maven Wrapper...
@"%JAVA_HOME%\bin\java.exe" -jar "%~dp0.mvn\wrapper\maven-wrapper.jar" %MAVEN_CMD_LINE_ARGS%

@IF %ERRORLEVEL% NEQ 0 GOTO error
@GOTO end

:error
@SET ERROR_CODE=1

:end
@ENDLOCAL & SET ERROR_CODE=%ERROR_CODE%
@EXIT /B %ERROR_CODE%
