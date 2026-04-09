"""claude-dashboard backend HTTP server.

Serve arquivos estáticos (HTML/CSS/JS/JSON) e expõe uma API REST em
`/api/processes/*` que orquestra o daemon do pm2 via `api.processes`.

Segurança: bind em 127.0.0.1 apenas. Nunca expor em 0.0.0.0.
"""

from __future__ import annotations

import json
from http import HTTPStatus
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from api import processes

ROOT = Path(__file__).parent
HOST = "127.0.0.1"
PORT = 8080

ALLOWED_ACTIONS: frozenset[str] = frozenset({"start", "stop", "restart"})


class DashboardHandler(SimpleHTTPRequestHandler):
    """Handler combinado: estático + /api/processes/*."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    # ------------------------------------------------------------------ GET
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._route_api_get(parsed.path, parse_qs(parsed.query))
            return
        super().do_GET()

    # ----------------------------------------------------------------- POST
    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._route_api_post(parsed.path)
            return
        # Mantém comportamento legado: aceita POSTs quietos em outras rotas
        length = int(self.headers.get("Content-Length", 0))
        if length:
            self.rfile.read(length)
        self._send_json({"ok": True}, HTTPStatus.OK)

    # ------------------------------------------------------------------ log
    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        # Silencia ruído dos polls do dashboard
        msg = format % args
        if "/api/processes" in msg and " 200 " in msg:
            return
        super().log_message(format, *args)

    # -------------------------------------------------------------- helpers
    def _send_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_error_json(self, message: str, status: HTTPStatus) -> None:
        self._send_json({"error": message}, status)

    # ------------------------------------------------------------- routing
    def _route_api_get(self, path: str, query: dict[str, list[str]]) -> None:
        # GET /api/processes
        if path == "/api/processes":
            try:
                self._send_json({"processes": processes.list_processes()})
            except processes.ProcessError as exc:
                self._send_error_json(str(exc), HTTPStatus.BAD_GATEWAY)
            return

        # GET /api/processes/<name>/logs
        parts = path.strip("/").split("/")
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "processes" and parts[3] == "logs":
            name = parts[2]
            lines = int(query.get("lines", ["30"])[0])
            try:
                self._send_json(processes.logs(name, lines=lines))
            except processes.ProcessError as exc:
                self._send_error_json(str(exc), HTTPStatus.BAD_REQUEST)
            return

        self._send_error_json("rota não encontrada", HTTPStatus.NOT_FOUND)

    def _route_api_post(self, path: str) -> None:
        # POST /api/processes/<name>/<action>
        parts = path.strip("/").split("/")
        if len(parts) != 4 or parts[0] != "api" or parts[1] != "processes":
            self._send_error_json("rota não encontrada", HTTPStatus.NOT_FOUND)
            return

        name, action = parts[2], parts[3]
        if action not in ALLOWED_ACTIONS:
            self._send_error_json(f"ação inválida: {action}", HTTPStatus.BAD_REQUEST)
            return

        handler = getattr(processes, action)
        try:
            result = handler(name)
            self._send_json({"ok": True, "process": result})
        except processes.ProcessError as exc:
            self._send_error_json(str(exc), HTTPStatus.BAD_REQUEST)


def main() -> None:
    server = HTTPServer((HOST, PORT), DashboardHandler)
    print(f"Serving claude-dashboard on http://{HOST}:{PORT}")
    print(f"API:    http://{HOST}:{PORT}/api/processes")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
