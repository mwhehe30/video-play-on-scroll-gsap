ffmpeg-online.vercel.app

-c:v libx264 -pix_fmt yuv420p -profile:v high -preset veryslow -movflags +faststart -an -vf fps=24 -x264-params "scenecut=0" -g 1 -crf 19

# ffmpeg command:

ffmpeg -i input.mp4 -vf "format=yuv420p,scale=-1:1080" -vcodec libx264 -profile:v main -level:v 5.1 -crf 20 -preset slow -tune animation -movflags +faststart -keyint_min 6 -g 6 -strict -2 -an outscrub.mp4
------------------------------\*/
