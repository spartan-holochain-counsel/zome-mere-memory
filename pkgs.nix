{ pkgs, system }:

import (pkgs.fetchFromGitHub {
  #owner = "spartan-holochain-counsel";
  owner = "pjkundert";
  repo = "nix-overlay";
  rev = "280242a915aefcc7dcad7b3b7333673b4cab8483"; # feature-arch
  sha256 = "sha256-OqTnBtT2pQcq1rLlEh6uorzSKbsIHYNR5Ebpts8309U=";
}) {
  inherit pkgs;
  inherit system;
}
