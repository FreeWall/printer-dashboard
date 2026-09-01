{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    electron
    nodejs_20
    yarn
    ffmpeg
    libnotify
  ];

  shellHook = ''
    export ELECTRON_PATH="${pkgs.electron}/bin/electron"
  '';
}
