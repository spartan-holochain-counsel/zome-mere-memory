{ pkgs, system }:

import (pkgs.fetchFromGitHub {
  owner = "pjkundert";
  repo = "nix-overlay";
  rev = "b0d96b12bca8aee8f664f6c0c3f899ed80460feb";
  sha256 = "sha256-oWHdfvWBvA1lCZZe3UMsqQ4dAv6zvpfPNsjOXbjuCDs=";
}) {
  inherit pkgs;
  inherit system;
}
