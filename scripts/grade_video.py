import subprocess
import imageio_ffmpeg
import imageio.v3 as iio

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

# Piecewise linear LUT: map background [55, 4, 1] to exact crimson-950 #240006 ([36, 0, 6])
r_expr = "if(lte(val,55), val*36/55, 36+(val-55)*219/200)"
g_expr = "if(lte(val,4), 0, (val-4)*255/251)"
b_expr = "if(lte(val,1), 8, 8+(val-1)*247/254)"

vf_filter = f"lutrgb=r='{r_expr}':g='{g_expr}':b='{b_expr}'"

input_file = "public/startup-animation.mp4"
output_file = "public/startup-animation-graded.mp4"

cmd = [
    ffmpeg, "-y", "-i", input_file,
    "-vf", vf_filter,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "copy",
    "-pix_fmt", "yuv420p",
    output_file
]

print("Running ffmpeg lutrgb...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("FFmpeg error:", res.stderr)
else:
    print("Grading completed successfully!")
    reader = iio.imiter(output_file)
    for idx, frame in enumerate(reader):
        if idx in [0, 20, 50, 90]:
            print(f"Frame {idx} corner rgb: {frame[0, 0]}, top-edge: {frame[5, 540]}, bottom-edge: {frame[1915, 540]}")
        if idx > 100:
            break
