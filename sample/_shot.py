"""Headless-Chrome screenshot helper with an exact viewport size.

Usage:  python _shot.py <url> <out.png> <width> <height>

Plain --window-size is clamped to a 500px minimum by headless Chrome, so this
drives the DevTools Protocol (Emulation.setDeviceMetricsOverride) instead.
No third-party packages: a minimal WebSocket client is implemented inline.
"""
import base64
import json
import os
import socket
import struct
import subprocess
import sys
import time
import urllib.request

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9333


def http_json(path):
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{path}", timeout=5) as r:
        return json.load(r)


class WS:
    """Just enough WebSocket (RFC 6455) for CDP text frames."""

    def __init__(self, url):
        hostport, path = url[5:].split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((
            f"GET /{path} HTTP/1.1\r\nHost: {host}:{port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        ).encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)

    def _send_raw(self, payload):
        header = bytearray([0x81])
        mask = os.urandom(4)
        n = len(payload)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        header += mask
        self.s.sendall(bytes(header) + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))

    def _recv_frame(self):
        buf = b""

        def rd(n):
            nonlocal buf
            while len(buf) < n:
                buf += self.s.recv(65536)
            out, buf = buf[:n], buf[n:]
            return out

        rd(1)
        (b2,) = rd(1)
        n = b2 & 0x7F
        if n == 126:
            (n,) = struct.unpack(">H", rd(2))
        elif n == 127:
            (n,) = struct.unpack(">Q", rd(8))
        return rd(n).decode()

    def cmd(self, cid, method, params=None):
        self._send_raw(json.dumps({"id": cid, "method": method, "params": params or {}}).encode())
        while True:
            msg = json.loads(self._recv_frame())
            if msg.get("id") == cid:
                return msg


def main():
    url, out, width, height = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    profile = os.path.join(os.environ["TEMP"], "pt-cdp-profile")
    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--disable-gpu", f"--remote-debugging-port={PORT}",
         f"--user-data-dir={profile}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(40):
            time.sleep(0.25)
            try:
                targets = http_json("/json/list")
                break
            except OSError:
                continue
        else:
            raise SystemExit("Chrome DevTools port never came up")
        page = next(t for t in targets if t["type"] == "page")
        ws = WS(page["webSocketDebuggerUrl"])
        ws.cmd(1, "Page.enable")
        ws.cmd(2, "Emulation.setDeviceMetricsOverride",
               {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 768})
        ws.cmd(3, "Page.navigate", {"url": url})
        time.sleep(2.5)
        # Grow the viewport to the full document height so the whole page is captured.
        r = ws.cmd(4, "Runtime.evaluate",
                   {"expression": "document.documentElement.scrollHeight", "returnByValue": True})
        full_h = min(int(r["result"]["result"]["value"]), 8000)
        if full_h != height:
            ws.cmd(5, "Emulation.setDeviceMetricsOverride",
                   {"width": width, "height": full_h, "deviceScaleFactor": 1, "mobile": width < 768})
            time.sleep(0.5)
        r = ws.cmd(6, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
        with open(out, "wb") as f:
            f.write(base64.b64decode(r["result"]["data"]))
        print(f"saved {out} ({width}x{full_h})")
    finally:
        chrome.terminate()


if __name__ == "__main__":
    main()