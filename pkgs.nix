{ pkgs, system }:

import (pkgs.fetchFromGitHub {
  owner = "pjkundert";
  repo = "nix-overlay";
  rev = "67613f9aff8428efe87e0e6cad26547524c5f736";
  sha256 = "sha256-pI2JZlygJk5gSkdneReCwXpwGmysvngkhYSiuY5zaO8=";
}) {
  inherit pkgs;
  inherit system;
}
