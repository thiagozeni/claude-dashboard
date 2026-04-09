"""pm2 wrapper — chamadas a `pm2 jlist` / start / stop / restart / logs.

Projetado para ser importado pelo `server.py` e exposto via HTTP em
`/api/processes/*`. Todas as chamadas usam `subprocess.run(shell=False)` com
argumentos como lista — sem risco de injeção.

Os nomes de processo aceitos são validados dinamicamente contra o que o
`pm2 jlist` retornar. O dashboard é local-only (127.0.0.1), então qualquer
processo que o usuário registrou no pm2 é controlável via UI.

O processo `claude-dashboard` é especial: é gerenciado pelo launchd (não pelo
pm2) porque ele é a própria UI — precisa estar sempre vivo. Por isso ações
destrutivas (stop/restart) sobre esse nome são rejeitadas para evitar o
paradoxo do "dashboard se desligando sozinho".
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

PM2_BIN = "/usr/local/bin/pm2"  # explícito pra não depender do PATH do shell pai

# Gerenciado pelo launchd, não pelo pm2. Ações destrutivas são bloqueadas.
LAUNCHD_MANAGED: frozenset[str] = frozenset({"claude-dashboard"})


class ProcessError(Exception):
    """Erro operacional do pm2 (daemon morto, nome inválido, timeout, etc)."""


@dataclass(frozen=True)
class ProcessInfo:
    """Snapshot de um processo pm2 para resposta JSON."""

    id: int | None
    name: str
    status: str  # online | stopped | errored | launching | stopping | ...
    pid: int | None
    cpu: float
    memory: int  # bytes
    uptime_ms: int | None
    restarts: int
    port: int | None
    cwd: str
    managed_by: str  # "pm2" | "launchd"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "pid": self.pid,
            "cpu": self.cpu,
            "memory": self.memory,
            "uptimeMs": self.uptime_ms,
            "restarts": self.restarts,
            "port": self.port,
            "cwd": self.cwd,
            "managedBy": self.managed_by,
        }


# ---------------------------------------------------------------------------
# Low-level pm2 helpers
# ---------------------------------------------------------------------------


def _run_pm2(args: list[str], timeout: float = 8.0) -> subprocess.CompletedProcess[str]:
    """Executa `pm2 <args>` com argumentos como lista (sem shell)."""
    try:
        return subprocess.run(
            [PM2_BIN, *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError as exc:
        raise ProcessError(f"pm2 não encontrado em {PM2_BIN}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ProcessError(f"pm2 {' '.join(args)} timeout após {timeout}s") from exc


def _require_mutable(name: str) -> None:
    """Ações destrutivas só em processos pm2 — nunca no claude-dashboard (launchd)."""
    if name in LAUNCHD_MANAGED:
        raise ProcessError(
            f"{name} é gerenciado pelo launchd — reinicie via "
            f"'launchctl kickstart -k gui/$(id -u)/com.pro15.claude-dashboard'"
        )


def _parse_port_from_args(args: str | None) -> int | None:
    """Tenta extrair uma porta de argumentos ou env. Best effort."""
    if not args:
        return None
    for token in args.split():
        if token.isdigit() and 1024 <= int(token) <= 65535:
            return int(token)
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def list_processes() -> list[dict[str, Any]]:
    """Lista todos os processos pm2 + o claude-dashboard (launchd) no topo."""
    result = _run_pm2(["jlist"])
    if result.returncode != 0:
        raise ProcessError(f"pm2 jlist falhou: {result.stderr.strip()}")

    try:
        raw = json.loads(result.stdout or "[]")
    except json.JSONDecodeError as exc:
        raise ProcessError("pm2 jlist retornou JSON inválido") from exc

    out: list[ProcessInfo] = [_launchd_dashboard_info()]

    for item in raw:
        name = item.get("name", "")
        monit = item.get("monit") or {}
        pm2_env = item.get("pm2_env") or {}
        env = pm2_env.get("env") or {}
        out.append(
            ProcessInfo(
                id=item.get("pm_id"),
                name=name,
                status=pm2_env.get("status", "unknown"),
                pid=item.get("pid") if (item.get("pid") or 0) > 0 else None,
                cpu=float(monit.get("cpu", 0) or 0),
                memory=int(monit.get("memory", 0) or 0),
                uptime_ms=_compute_uptime_ms(pm2_env),
                restarts=int(pm2_env.get("restart_time", 0) or 0),
                port=_parse_port_from_args(env.get("PORT"))
                or _parse_port_from_name(name),
                cwd=pm2_env.get("pm_cwd", ""),
                managed_by="pm2",
            )
        )

    out.sort(
        key=lambda p: (
            p.managed_by != "launchd",  # launchd primeiro
            p.status != "online",        # depois online
            p.name.lower(),
        )
    )
    return [p.to_dict() for p in out]


def _launchd_dashboard_info() -> ProcessInfo:
    """Snapshot do claude-dashboard lendo do próprio processo Python atual."""
    import time

    pid = os.getpid()
    mem = _rss_bytes(pid)

    return ProcessInfo(
        id=None,
        name="claude-dashboard",
        status="online",  # se este código roda, o dashboard está online
        pid=pid,
        cpu=0.0,
        memory=mem,
        uptime_ms=int((time.time() - _START_TIME) * 1000),
        restarts=0,
        port=8080,
        cwd=str(Path(__file__).parent.parent),
        managed_by="launchd",
    )


def _rss_bytes(pid: int) -> int:
    """Lê RSS em bytes via `ps -o rss= -p <pid>` (KB → bytes)."""
    try:
        result = subprocess.run(
            ["/bin/ps", "-o", "rss=", "-p", str(pid)],
            capture_output=True,
            text=True,
            timeout=2,
            check=False,
        )
        return int(result.stdout.strip()) * 1024
    except (ValueError, subprocess.SubprocessError):
        return 0


def _parse_port_from_name(name: str) -> int | None:
    """Heurística: se o nome termina em -NNNN e NNNN é porta válida, extrai."""
    tail = name.rsplit("-", 1)[-1]
    if tail.isdigit() and 1024 <= int(tail) <= 65535:
        return int(tail)
    return None


import time as _time

_START_TIME: float = _time.time()


def _compute_uptime_ms(pm2_env: dict[str, Any]) -> int | None:
    if pm2_env.get("status") != "online":
        return None
    started = pm2_env.get("pm_uptime")
    if not started:
        return None
    import time

    return int(time.time() * 1000) - int(started)


def start(name: str) -> dict[str, Any]:
    _require_mutable(name)
    result = _run_pm2(["start", name])
    if result.returncode != 0:
        raise ProcessError(f"pm2 start falhou: {result.stderr.strip()}")
    return _find_by_name(name)


def stop(name: str) -> dict[str, Any]:
    _require_mutable(name)
    result = _run_pm2(["stop", name])
    if result.returncode != 0:
        raise ProcessError(f"pm2 stop falhou: {result.stderr.strip()}")
    return _find_by_name(name)


def restart(name: str) -> dict[str, Any]:
    _require_mutable(name)
    result = _run_pm2(["restart", name])
    if result.returncode != 0:
        raise ProcessError(f"pm2 restart falhou: {result.stderr.strip()}")
    return _find_by_name(name)


def logs(name: str, lines: int = 30) -> dict[str, str]:
    """Retorna as últimas N linhas de stdout/stderr do processo."""
    if name in LAUNCHD_MANAGED:
        # O plist aponta StandardOut/ErrorPath para logs/server.log
        log_file = Path(__file__).parent.parent / "logs" / "server.log"
        content = _tail_file(log_file, lines)
        return {"stdout": content, "stderr": ""}

    # pm2 guarda logs em ~/.pm2/logs/<name>-out.log e <name>-error.log
    pm2_home = Path(os.environ.get("PM2_HOME", str(Path.home() / ".pm2")))
    out_file = pm2_home / "logs" / f"{name}-out.log"
    err_file = pm2_home / "logs" / f"{name}-error.log"
    return {
        "stdout": _tail_file(out_file, lines),
        "stderr": _tail_file(err_file, lines),
    }


def _tail_file(path: Path, lines: int) -> str:
    if not path.exists():
        return ""
    try:
        with path.open("r", encoding="utf-8", errors="replace") as fh:
            content = fh.readlines()
        return "".join(content[-lines:])
    except OSError:
        return ""


def _find_by_name(name: str) -> dict[str, Any]:
    for item in list_processes():
        if item["name"] == name:
            return item
    raise ProcessError(f"processo não encontrado após ação: {name}")
