{ pkgs, system }:

import (pkgs.fetchFromGitHub {
  #owner = "spartan-holochain-counsel";
  owner = "pjkundert";
  repo = "nix-overlay";
  rev = "dbd4d2b28d861a9536a89d7012a730ebbca28676"; # feature-arch
  sha256 = "sha256-xeE4gFEssB17Hr69JepP2k5J8uwrSQdpMtvn99Pd7oQ=";
}) {
  inherit pkgs;
  inherit system;
}
