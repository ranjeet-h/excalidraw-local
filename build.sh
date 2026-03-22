#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PACKAGE_JSON_PATH="$ROOT_DIR/package.json"
TAURI_CONFIG_PATH="$ROOT_DIR/src-tauri/tauri.conf.json"
CARGO_TOML_PATH="$ROOT_DIR/src-tauri/Cargo.toml"

ORIGINAL_PACKAGE_JSON="$(cat "$PACKAGE_JSON_PATH")"
ORIGINAL_TAURI_CONFIG="$(cat "$TAURI_CONFIG_PATH")"
ORIGINAL_CARGO_TOML="$(cat "$CARGO_TOML_PATH")"
BUILD_SUCCEEDED="false"

restore_versions_on_failure() {
  if [[ "$BUILD_SUCCEEDED" == "true" ]]; then
    return
  fi

  printf '%s' "$ORIGINAL_PACKAGE_JSON" >"$PACKAGE_JSON_PATH"
  printf '%s' "$ORIGINAL_TAURI_CONFIG" >"$TAURI_CONFIG_PATH"
  printf '%s' "$ORIGINAL_CARGO_TOML" >"$CARGO_TOML_PATH"
}

trap restore_versions_on_failure EXIT

read_version_field() {
  local file_path="$1"
  local field_name="$2"

  node --input-type=module -e "
    import fs from 'node:fs'
    const json = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'))
    console.log(json[process.argv[2]])
  " "$file_path" "$field_name"
}

CURRENT_VERSION="$(read_version_field "$TAURI_CONFIG_PATH" "version")"
NEXT_VERSION="$(node --input-type=module -e "
  const [major, minor, patch] = process.argv[1].split('.').map(Number)
  console.log([major, minor, patch + 1].join('.'))
" "$CURRENT_VERSION")"

echo "Current app version: $CURRENT_VERSION"
echo "Next app version:    $NEXT_VERSION"

npm version --no-git-tag-version "$NEXT_VERSION" >/dev/null

node --input-type=module -e "
  import fs from 'node:fs'
  const filePath = process.argv[1]
  const nextVersion = process.argv[2]
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  json.version = nextVersion
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n')
" "$TAURI_CONFIG_PATH" "$NEXT_VERSION"

node --input-type=module -e "
  import fs from 'node:fs'
  const filePath = process.argv[1]
  const nextVersion = process.argv[2]
  const cargoToml = fs.readFileSync(filePath, 'utf8').replace(
    /^version = \".*\"$/m,
    \`version = \"\${nextVersion}\"\`,
  )
  fs.writeFileSync(filePath, cargoToml)
" "$CARGO_TOML_PATH" "$NEXT_VERSION"

if ! rustup target list --installed | grep -qx "x86_64-apple-darwin"; then
  echo "Installing x86_64-apple-darwin Rust target for universal macOS builds..."
  rustup target add x86_64-apple-darwin
fi

echo "Building unsigned universal macOS app + DMG..."
npx tauri build --target universal-apple-darwin --bundles app,dmg --no-sign

ARTIFACT_SOURCE_DIR="$ROOT_DIR/src-tauri/target/universal-apple-darwin/release/bundle"
BUILD_OUTPUT_ROOT="$ROOT_DIR/build/macos-universal"
ARTIFACT_OUTPUT_DIR="$BUILD_OUTPUT_ROOT/$NEXT_VERSION"

rm -rf "$ARTIFACT_OUTPUT_DIR"
mkdir -p "$ARTIFACT_OUTPUT_DIR"

if [[ -d "$ARTIFACT_SOURCE_DIR/macos" ]]; then
  find "$ARTIFACT_SOURCE_DIR/macos" -maxdepth 1 -name "*.app" -exec cp -R {} "$ARTIFACT_OUTPUT_DIR/" \;
elif [[ -d "$ARTIFACT_SOURCE_DIR/app" ]]; then
  find "$ARTIFACT_SOURCE_DIR/app" -maxdepth 1 -name "*.app" -exec cp -R {} "$ARTIFACT_OUTPUT_DIR/" \;
fi

find "$ARTIFACT_SOURCE_DIR/dmg" -maxdepth 1 -name "*.dmg" -exec cp {} "$ARTIFACT_OUTPUT_DIR/" \;

# Keep only the newest versioned build output so the build directory doesn't grow without bound.
if [[ -d "$BUILD_OUTPUT_ROOT" ]]; then
  find "$BUILD_OUTPUT_ROOT" -mindepth 1 -maxdepth 1 ! -name "$NEXT_VERSION" -exec rm -rf {} +
fi

BUILD_SUCCEEDED="true"

echo "Copied artifacts to $ARTIFACT_OUTPUT_DIR"
find "$ARTIFACT_OUTPUT_DIR" -maxdepth 1 \( -name "*.app" -o -name "*.dmg" \) -exec du -sh {} \;
