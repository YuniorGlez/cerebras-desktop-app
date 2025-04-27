#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# PATH is now set by the calling process (mcpManager.js), but log it here for confirmation
# echo "Received PATH: $PATH" # Commented out script log

# Print debugging information
# echo "Running deno with PATH: $PATH" # Commented out script log
# echo "Deno location: $(which deno 2>/dev/null || echo 'Deno not found')" # Commented out script log

# Get the deno path
DENO_PATH=$(which deno)

if [ -z "$DENO_PATH" ]; then
  # Note: Errors will now go to the parent process stderr again
  echo "Error: Deno executable not found in PATH: $PATH" >&2
  exit 1
fi

# Execute deno with the arguments passed to this script
# Use exec to replace the shell process, ensuring Deno inherits the original stdio for MCP
exec "$DENO_PATH" "$@" 