#!/bin/bash
cd /mnt/pfs/users/huangzehuan/workspace/project_page/artifacts/sources || exit 1
FF=/mnt/pfs/users/huangzehuan/workspace/project_page/scripts/ffmpeg
find . -name '*.mp4' -print0 | while IFS= read -r -d '' v; do
  d="${v%.*}"
  if find "$d" -maxdepth 1 -name '*.jpg' -print -quit 2>/dev/null | grep -q .; then
    continue
  fi
  mkdir -p "$d" || { echo "FAIL mkdir $v"; continue; }
  if "$FF" -hide_banner -loglevel error -nostdin -i "$v" -vf fps=1 -q:v 3 "$d/%06d.jpg"; then
    echo "OK $v"
  else
    echo "FAIL $v"
  fi
done
echo ALL_DONE
