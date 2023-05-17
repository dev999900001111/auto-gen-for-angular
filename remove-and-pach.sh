#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 packName"
  exit 1
fi


dire="./gen"
packName=${1}

# Create a tgz archive
tar -cvf "${packName}".tar prompts/ 000-requirements.md
tar -rvf "${packName}".tar -C ${dire} src
gzip "${packName}".tar
#	/src/app/dialogs/ \
#	/src/app/pages/ \
#	/src/app/parts/ \
#	/src/app/services/ \
#	/src/app/models.ts \
#	/src/assets/ \
#	/src/app/app.module.ts \
#	/src/app/app-routing.module.ts \
#	/src/app/api.interceptor.ts

ret=${?}
echo ret=${ret}

# Check the exit code of tar
if [ ${ret} -eq 0 ]; then
  # Remove the original directories and files
  rm -fr src/app/dialogs/ \
	  ${dire}/src/ \
	  prompts/
else
  echo "Failed to create the archive"
  exit 1
fi
