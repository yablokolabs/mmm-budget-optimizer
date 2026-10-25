#!/usr/bin/env bash
# Install the mmm CLI from mmm-engine and print its path.
#
# 1. Prebuilt release binary for this OS (Linux x86-64/arm64, macOS arm64),
#    verified against the release's SHA-256 checksum.
# 2. If no binary fits (or it will not run here), build from source.
#
# Usage:  bash install_engine.sh            # prints e.g. /home/me/.local/share/mmm-engine/bin/mmm
# Env:    MMM_VERSION (default v0.2.1), MMM_HOME (default ~/.local/share/mmm-engine),
#         MMM_FROM_SOURCE=1 to skip the prebuilt binary
set -euo pipefail

VERSION="${MMM_VERSION:-v0.2.1}"
HOME_DIR="${MMM_HOME:-$HOME/.local/share/mmm-engine}"
REPO="https://github.com/yablokolabs/mmm-engine"
BIN="$HOME_DIR/bin/mmm"

log() { echo "install_engine: $*" >&2; }

# Already installed at this version?
if [ -x "$BIN" ] && [ "$(cat "$HOME_DIR/bin/VERSION" 2>/dev/null)" = "$VERSION" ] && "$BIN" help >/dev/null 2>&1; then
	log "mmm $VERSION already installed"
	echo "$BIN"
	exit 0
fi
mkdir -p "$HOME_DIR/bin"

sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }

case "$(uname -s)-$(uname -m)" in
	Linux-x86_64) asset="linux-x86_64" ;;
	Linux-aarch64 | Linux-arm64) asset="linux-arm64" ;;
	Darwin-arm64) asset="macos-arm64" ;;
	*) asset="" ;;
esac

try_binary() {
	[ -n "$asset" ] || return 1
	command -v curl >/dev/null || { log "curl not found"; return 1; }
	local name="mmm-$VERSION-$asset" tmp
	tmp="$(mktemp -d)"
	log "downloading $name.tar.gz"
	curl -fsSL -o "$tmp/$name.tar.gz" "$REPO/releases/download/$VERSION/$name.tar.gz" || { log "download failed"; return 1; }
	curl -fsSL -o "$tmp/$name.tar.gz.sha256" "$REPO/releases/download/$VERSION/$name.tar.gz.sha256" || { log "checksum download failed"; return 1; }
	local want got
	want="$(cut -d' ' -f1 "$tmp/$name.tar.gz.sha256")"
	got="$(sha256 "$tmp/$name.tar.gz")"
	[ "$want" = "$got" ] || { log "checksum mismatch: expected $want, got $got"; return 1; }
	tar -xzf "$tmp/$name.tar.gz" -C "$tmp"
	"$tmp/$name/mmm" help >/dev/null 2>&1 || { log "prebuilt binary does not run here (e.g. glibc older than 2.38)"; return 1; }
	cp "$tmp/$name/mmm" "$BIN" || return 1
	log "installed prebuilt binary (checksum verified)"
}

try_source() {
	for tool in git cmake; do
		command -v "$tool" >/dev/null || { log "$tool not found; install it or use Docker: docker run --rm -v \"\$PWD:/work\" ghcr.io/yablokolabs/mmm-engine:${VERSION#v} help"; return 1; }
	done
	local src="$HOME_DIR/src"
	log "building $VERSION from source (under a minute)"
	if [ -d "$src/.git" ]; then
		git -C "$src" fetch -q --depth 1 origin "refs/tags/$VERSION:refs/tags/$VERSION"
		git -C "$src" -c advice.detachedHead=false checkout -q "$VERSION"
	else
		git -c advice.detachedHead=false clone -q --depth 1 --branch "$VERSION" "$REPO" "$src"
	fi
	cmake -S "$src" -B "$src/build" >/dev/null
	cmake --build "$src/build" -- -j4 >/dev/null
	"$src/build/mmm_tests" >/dev/null || { log "engine tests failed; run $src/build/mmm_tests to see why"; return 1; }
	cp "$src/build/mmm" "$BIN" || return 1
	log "built from source; tests passed"
}

if { [ "${MMM_FROM_SOURCE:-0}" != 1 ] && try_binary; } || try_source; then
	echo "$VERSION" > "$HOME_DIR/bin/VERSION"
	echo "$BIN"
else
	log "could not install mmm $VERSION"
	exit 1
fi
