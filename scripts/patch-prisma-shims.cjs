const fs = require('fs');
const path = require('path');

const root = process.cwd();
const binDir = path.join(root, 'node_modules', '.bin');

const files = {
  'prisma.cmd': `@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\\node.exe" (
  SET "_prog=%dp0%\\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\..\\..\\scripts\\prisma-studio-wrapper.cjs" %*
`,
  'prisma': `#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
    *CYGWIN*|*MINGW*|*MSYS*)
        if command -v cygpath > /dev/null 2>&1; then
            basedir=\`cygpath -w "$basedir"\`
        fi
    ;;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../../scripts/prisma-studio-wrapper.cjs" "$@"
else 
  exec node  "$basedir/../../scripts/prisma-studio-wrapper.cjs" "$@"
fi
`,
  'prisma.ps1': `#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  $exe=".exe"
}
$ret=0
if (Test-Path "$basedir/node$exe") {
  if ($MyInvocation.ExpectingInput) {
    $input | & "$basedir/node$exe"  "$basedir/../../scripts/prisma-studio-wrapper.cjs" $args
  } else {
    & "$basedir/node$exe"  "$basedir/../../scripts/prisma-studio-wrapper.cjs" $args
  }
  $ret=$LASTEXITCODE
} else {
  if ($MyInvocation.ExpectingInput) {
    $input | & "node$exe"  "$basedir/../../scripts/prisma-studio-wrapper.cjs" $args
  } else {
    & "node$exe"  "$basedir/../../scripts/prisma-studio-wrapper.cjs" $args
  }
  $ret=$LASTEXITCODE
}
exit $ret
`,
};

for (const [name, content] of Object.entries(files)) {
  const filePath = path.join(binDir, name);
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log('Patched Prisma shims to force Studio default port 5555.');
