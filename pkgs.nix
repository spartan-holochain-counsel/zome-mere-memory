{ pkgs, system }:

import (pkgs.fetchFromGitHub {
  owner = "spartan-holochain-counsel";
  repo = "nix-overlay";
  rev = "5046d25439ee9da1e469a975d26f538622f2f3fc";
  sha256 = "sha256-cUEqTp3wxTeCBBd/dtjuck/1vyR1YXGcimkmd8ZXcRw=";
}) {
  inherit pkgs;
  inherit system;
}
