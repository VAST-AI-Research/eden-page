#!/usr/bin/env python3
"""本地预览用的静态服务器，支持视频的 Range 请求。

`python -m http.server` 在 3.11 及更早只把整个文件从头推出去。浏览器读 mp4
要先取文件头再按需取后面的数据，连接会被中途掐掉，轮播里的视频就停在空画面。
标准库要到 3.12 才自己处理 Range。这个脚本跑在现有的 Python 上即可：

    python scripts/serve.py            # http://0.0.0.0:8000/
    python scripts/serve.py 8002
"""

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        try:
            file = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        try:
            size = os.fstat(file.fileno()).st_size
            ctype = self.guess_type(path)
            range_header = self.headers.get("Range")
            if not range_header:
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(size))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                return file

            # 只处理单个 bytes=start-end。不认识的写法退回整文件，
            # 浏览器会自己再决定要不要发更简单的请求。
            if not range_header.startswith("bytes=") or "," in range_header:
                file.close()
                return super().send_head()

            start_s, _, end_s = range_header[6:].partition("-")
            try:
                if start_s == "":
                    length = int(end_s)
                    start, end = size - length, size - 1
                else:
                    start = int(start_s)
                    end = int(end_s) if end_s else size - 1
            except ValueError:
                start, end = 0, -1

            if start < 0 or start >= size or end < start:
                self.send_error(416, "Requested range not satisfiable")
                self.send_header("Content-Range", f"bytes */{size}")
                self.end_headers()
                file.close()
                return None

            end = min(end, size - 1)
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(end - start + 1))
            self.end_headers()
            file.seek(start)
            self._range_remaining = end - start + 1
            return file
        except Exception:
            file.close()
            raise

    def copyfile(self, source, output):
        remaining = getattr(self, "_range_remaining", None)
        if remaining is None:
            return super().copyfile(source, output)
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            output.write(chunk)
            remaining -= len(chunk)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = partial(RangeRequestHandler, directory=root)
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"Serving {root} at http://0.0.0.0:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
