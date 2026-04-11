#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="${OPSH_INSTALL_ROOT:-$HOME/.opsh}"
INSTALL_BIN_DIR="$INSTALL_ROOT/bin"
RC_FILES=("$HOME/.zprofile" "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile")
RELEASE_REPO="rwov/opsh"
SCRIPT_BASE_URL="https://opsh.dxu.one"

platform_name() {
  case "$(uname -s)" in
    Darwin) printf 'darwin' ;;
    Linux) printf 'linux' ;;
    *)
      printf 'Unsupported platform.\n' >&2
      exit 1
      ;;
  esac
}

arch_name() {
  case "$(uname -m)" in
    arm64|aarch64) printf 'arm64' ;;
    x86_64|amd64) printf 'x64' ;;
    *)
      printf 'Unsupported architecture.\n' >&2
      exit 1
      ;;
  esac
}

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Required tool not found: %s\n' "$1" >&2
    exit 1
  fi
}

download_file() {
  url="$1"
  output_path="$2"

  curl -fsSL "$url" -o "$output_path"
}

fetch_latest_release_json() {
  latest_url="https://api.github.com/repos/$RELEASE_REPO/releases/latest"
  releases_url="https://api.github.com/repos/$RELEASE_REPO/releases"

  if release_json="$(curl -fsSL -H "Accept: application/vnd.github+json" "$latest_url" 2>/dev/null)"; then
    printf '%s\n' "$release_json"
    return 0
  fi

  releases_json="$(curl -fsSL -H "Accept: application/vnd.github+json" "$releases_url")"
  first_release_json="$(
    printf '%s\n' "$releases_json" | awk '
      BEGIN { depth = 0; found = 0; started = 0; out = "" }
      /^\[/ { next }
      {
        line = $0
        open_count = gsub(/\{/, "{", line)
        close_count = gsub(/\}/, "}", line)

        if (started == 0 && index($0, "{") > 0) {
          started = 1
        }

        if (started == 1) {
          out = out $0 "\n"
          depth += open_count
          depth -= close_count
          if (depth == 0) {
            print out
            exit
          }
        }
      }
    '
  )"

  if [ -z "$first_release_json" ]; then
    printf 'Could not find any published GitHub releases in %s\n' "$RELEASE_REPO" >&2
    exit 1
  fi

  printf '%s\n' "$first_release_json"
}

resolve_asset_url() {
  release_json="$1"
  platform="$2"
  arch="$3"
  asset_platform_primary="$platform"
  asset_platform_secondary=""

  if [ "$platform" = "darwin" ]; then
    asset_platform_primary="macos"
    asset_platform_secondary="darwin"
  fi

  asset_urls="$(
    printf '%s\n' "$release_json" |
      sed -n 's/.*"browser_download_url": "\(https:[^"]*\)".*/\1/p'
  )"

  if [ -z "$asset_urls" ]; then
    return 1
  fi

  printf '%s\n' "$asset_urls" | awk -v platform1="$asset_platform_primary" -v platform2="$asset_platform_secondary" -v arch="$arch" '
    index($0, "checksums") == 0 &&
    index($0, "sha256") == 0 &&
    index($0, "/opsh-") > 0 &&
    (index($0, platform1) > 0 || (platform2 != "" && index($0, platform2) > 0)) &&
    (index($0, arch) > 0 || (arch == "x64" && index($0, "amd64") > 0)) &&
    ($0 ~ /\.tar\.gz$/ || $0 ~ /\.tgz$/ || $0 ~ /\.zip$/ || substr($0, length($0) - 4) == "/opsh") {
      print
      exit
    }
  '
}

extract_asset() {
  asset_path="$1"
  destination_dir="$2"

  case "$asset_path" in
    *.tar.gz|*.tgz)
      tar -xzf "$asset_path" -C "$destination_dir"
      ;;
    *.zip)
      require_tool unzip
      unzip -q "$asset_path" -d "$destination_dir"
      ;;
    *)
      cp "$asset_path" "$destination_dir/opsh"
      chmod 755 "$destination_dir/opsh"
      ;;
  esac
}

locate_bundle_dir() {
  search_dir="$1"

  binary_path="$(
    find "$search_dir" -type f -name 'opsh' -perm -u+x 2>/dev/null | head -n 1
  )"

  if [ -z "$binary_path" ]; then
    return 1
  fi

  dirname "$binary_path"
}

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

append_managed_block() {
  file_path="$1"
  mkdir -p "$(dirname "$file_path")"
  touch "$file_path"
  remove_managed_block "$file_path"

  if [ -s "$file_path" ]; then
    printf '\n' >>"$file_path"
  fi

  cat >>"$file_path" <<EOF
# >>> opsh initialize >>>
export PATH="$INSTALL_BIN_DIR:\$PATH"
case \$- in
  *i*)
    if [ -z "\${OPSH_DISABLE_AUTO:-}" ] && [ -z "\${OPSH_ACTIVE_SHELL:-}" ] && [ -x "$INSTALL_BIN_DIR/opsh" ]; then
      OPSH_ACTIVE_SHELL=1 "$INSTALL_BIN_DIR/opsh"
      opsh_status=\$?
      if [ "\$opsh_status" -ne 0 ]; then
        printf 'opsh failed to start (exit %s); continuing in %s.\n' "\$opsh_status" "\${SHELL##*/}" >&2
      fi
    fi
    ;;
esac
# <<< opsh initialize <<<
EOF
}

PLATFORM="$(platform_name)"
ARCH="$(arch_name)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

require_tool curl

printf 'Installing opsh...\n'
printf 'Fetching latest opsh release from GitHub...\n'
RELEASE_JSON="$(fetch_latest_release_json)"
ASSET_URL="$(resolve_asset_url "$RELEASE_JSON" "$PLATFORM" "$ARCH")"

if [ -z "$ASSET_URL" ]; then
  printf 'Could not find a release asset for %s-%s in %s\n' "$PLATFORM" "$ARCH" "$RELEASE_REPO" >&2
  printf 'Expected an asset name like opsh-macos-arm64.tar.gz or opsh-linux-x64.tar.gz\n' >&2
  exit 1
fi

ASSET_NAME="${ASSET_URL##*/}"
ASSET_PATH="$TMP_DIR/$ASSET_NAME"
EXTRACT_DIR="$TMP_DIR/extracted"
mkdir -p "$EXTRACT_DIR"

printf 'Downloading %s...\n' "$ASSET_NAME"
download_file "$ASSET_URL" "$ASSET_PATH"
extract_asset "$ASSET_PATH" "$EXTRACT_DIR"

BUNDLE_DIR="$(locate_bundle_dir "$EXTRACT_DIR")"
if [ -z "$BUNDLE_DIR" ] || [ ! -x "$BUNDLE_DIR/opsh" ]; then
  printf 'Downloaded release does not contain an executable opsh binary.\n' >&2
  exit 1
fi

printf 'Installing opsh binary...\n'
mkdir -p "$INSTALL_ROOT"
rm -rf "$INSTALL_BIN_DIR"
mkdir -p "$INSTALL_BIN_DIR"
cp -R "$BUNDLE_DIR/." "$INSTALL_BIN_DIR/"

printf 'Refreshing install scripts...\n'
download_file "$SCRIPT_BASE_URL/install.sh" "$INSTALL_ROOT/install.sh"
download_file "$SCRIPT_BASE_URL/uninstall.sh" "$INSTALL_ROOT/uninstall.sh"
chmod 755 "$INSTALL_BIN_DIR/opsh" "$INSTALL_ROOT/install.sh" "$INSTALL_ROOT/uninstall.sh"

for rc_file in "${RC_FILES[@]}"; do
  append_managed_block "$rc_file"
  printf 'Added opsh auto-start to %s\n' "$rc_file"
done

printf '\nopsh installed successfully!\n\n'
printf 'Open a new terminal to start using opsh, or run: opsh\n'
