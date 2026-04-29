#!/bin/bash
cd ~/proyectos_web/virtual-bike-landing/src/assets

# Hero (alta calidad, max 2400px)
ffmpeg -y -i virtual9.jpg  -vf scale=2400:-1 -q:v 3 virtual9_c.jpg  2>/dev/null && echo "OK virtual9"
ffmpeg -y -i virtual7.jpg  -vf scale=2400:-1 -q:v 3 virtual7_c.jpg  2>/dev/null && echo "OK virtual7"
ffmpeg -y -i virtual11.jpeg -vf scale=2400:-1 -q:v 3 virtual11_c.jpg 2>/dev/null && echo "OK virtual11"

# Flip cards (max 1600px)
ffmpeg -y -i virtual1.jpeg -vf scale=1600:-1 -q:v 4 virtual1_c.jpg  2>/dev/null && echo "OK virtual1"
ffmpeg -y -i virtual3.jpg  -vf scale=1600:-1 -q:v 4 virtual3_c.jpg  2>/dev/null && echo "OK virtual3"
ffmpeg -y -i virtual4.jpg  -vf scale=1600:-1 -q:v 4 virtual4_c.jpg  2>/dev/null && echo "OK virtual4"
ffmpeg -y -i virtual6.jpg  -vf scale=1600:-1 -q:v 4 virtual6_c.jpg  2>/dev/null && echo "OK virtual6"
ffmpeg -y -i virtual8.jpg  -vf scale=1600:-1 -q:v 4 virtual8_c.jpg  2>/dev/null && echo "OK virtual8"
ffmpeg -y -i virtual10.jpg -vf scale=1600:-1 -q:v 4 virtual10_c.jpg 2>/dev/null && echo "OK virtual10"

echo "--- Tamaños ---"
ls -lh *_c.jpg
