{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [pkgs.jq pkgs.s5cmd];
}
