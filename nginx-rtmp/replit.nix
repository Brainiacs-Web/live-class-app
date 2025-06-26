{ pkgs }: {
  deps = [
    # nginx with the RTMP module enabled
    (pkgs.nginxWithModules.override {
      modules = with pkgs.nginxModules; [ nginx-rtmp-module ];
    })
    pkgs.ffmpeg
  ];
}
