{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [pkgs.jq pkgs.imgp pkgs.inkscape];
}
