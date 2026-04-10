#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="${OPSH_INSTALL_ROOT:-$HOME/.opsh}"
PURGE_CONFIG=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --purge-config)
      PURGE_CONFIG=1
      ;;
    --yes)
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      exit 1
      ;;
  esac
  shift
done

remove_managed_block() {
  file_path="$1"
  [ -f "$file_path" ] || return 0

  tmp_file="$(mktemp)"
  awk '
    BEGIN { skip = 0 }
    $0 == "# >>> opsh initialize >>>" { skip = 1; next }
    $0 == "# <<< opsh initialize <<<" { skip = 0; next }
    skip == 0 { print }
  ' "$file_path" >"$tmp_file"
  mv "$tmp_file" "$file_path"
}

for rc_file in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile"; do
  remove_managed_block "$rc_file"
done

rm -rf "$INSTALL_ROOT/bin"
rm -f "$INSTALL_ROOT/install.sh" "$INSTALL_ROOT/uninstall.sh"

if [ "$PURGE_CONFIG" -eq 1 ]; then
  rm -f "$INSTALL_ROOT/config.json"
fi

rmdir "$INSTALL_ROOT" 2>/dev/null || true

printf 'Removed opsh shell integration.\n'
if [ "$PURGE_CONFIG" -eq 1 ]; then
  printf 'Removed %s/config.json\n' "$INSTALL_ROOT"
else
  printf 'Kept %s/config.json\n' "$INSTALL_ROOT"
fi
