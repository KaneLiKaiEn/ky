#!/usr/bin/env python3
"""微前端应用构建+推送+打包tar+上传服务器部署脚本

用法:
    python deploy.py webHost,webQualityControl,webNurseStation
    python deploy.py webHost --dry-run （仅预览命令）

流程 (每个微应用串行执行本地部分, 命令失败后可选择重试当前命令):
    对每个name:
        1. SSH读取192.168.1.180:/root/xmhis/values.yaml中image.<name>
        2. 按日期/序号规则计算新tag(仓库前缀替换为xmhis.top:30501)
        3. 在 /Users/youzhonghai/工作/项目/web2 下定位本地目录
           (host / remote/<kebab> / share/<kebab>)
           TODO: 根据个人设备自定义修改本地仓库地址 WEB2_ROOT
        4. 在该目录执行 npm ci (按 lockfile 严格安装) 后再 npm run build
        5. docker build --platform linux/amd64 -t <新tag> .
        6. docker login -u admin -p passw0rd xmhis.top:30501
        7. docker push <新tag>
        8. 在 ~/Downloads执行docker save -o xmweb-<kebab>.tar <新tag>
           TODO: 根据个人设备自定义修改存放位置 DOWNLOADS_DIR
        9. 通过SFTP上传xmweb-<kebab>.tar到服务器/root/tar/
    全部处理完毕后, 在服务器/root/下依次执行脚本:
        - make push
        - make (等待make push完成后)
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import paramiko
import yaml


SSH_HOST = "192.168.1.180"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASSWORD = "Kino2026@Amoy"
REMOTE_VALUES_PATH = "/root/xmhis/values.yaml"
REMOTE_TAR_DIR = "/root/tar"
REMOTE_MAKE_DIR = "/root"

REGISTRY_OLD_PREFIX = "sealos.hub:5000/"
REGISTRY_NEW = "xmhis.top:30501"
REGISTRY_USER = "admin"
REGISTRY_PASSWORD = "passw0rd"

# 固定的web2项目根目录, 用于定位host/remote/share子应用
WEB2_ROOT = Path("/Users/youzhonghai/工作/项目/web2")
DOWNLOADS_DIR = Path.home() / "Downloads"

# 匹配格式: <registry>/<image>:<major>-<YYMMDD>.<seq>
# 例如 sealos.hub:5000/xmweb-host:1.0-260716.01
TAG_RE = re.compile(
    r"^(?P<registry>[^/]+/)(?P<image>[^:]+):(?P<major>[^-]+)-(?P<date>\d{6})\.(?P<seq>\d+)$"
)


# ---------- 工具函数 ----------

def log(msg: str) -> None:
    print(f"[deploy] {msg}", flush=True)


def prompt_retry() -> bool:
    """等待用户选择重试当前命令或终止部署。"""
    while True:
        try:
            choice = input(
                "\n[deploy] 命令执行失败，按 Enter（或输入 r）重试当前命令，输入 q 终止: "
            ).strip().lower()
        except EOFError:
            return False

        if choice in ("", "r"):
            return True
        if choice == "q":
            return False
        print("[deploy] 无效输入，请按 Enter、输入 r 或输入 q。", file=sys.stderr)


def camel_to_kebab(name: str) -> str:
    """XxxYyyZzz -> xxx-yyy-zzz"""
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()


def strip_web_prefix(name: str) -> str:
    if not name.startswith("web"):
        raise ValueError(f"输入名称必须以 'web' 开头: {name}")
    return name[len("web"):]


def input_name_to_tar_stem(name: str) -> str:
    """webQualityControl -> xmweb-quality-control"""
    return f"xmweb-{camel_to_kebab(strip_web_prefix(name))}"


# ---------- SSH & YAML ----------

def fetch_remote_yaml() -> dict:
    """SSH+SFTP读取远程values.yaml内容并解析为dict。"""
    log(f"SSH 连接 {SSH_USER}@{SSH_HOST} 读取 {REMOTE_VALUES_PATH}")
    client = open_ssh()
    try:
        sftp = client.open_sftp()
        try:
            with sftp.open(REMOTE_VALUES_PATH, "r") as f:
                content = f.read()
        finally:
            sftp.close()
    finally:
        client.close()

    if isinstance(content, bytes):
        content = content.decode("utf-8")
    data = yaml.safe_load(content)
    if not isinstance(data, dict):
        raise RuntimeError("远程 values.yaml 解析结果不是字典")
    return data


def open_ssh() -> paramiko.SSHClient:
    """打开一个已完成认证的 SSH 客户端连接。"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SSH_HOST,
        port=SSH_PORT,
        username=SSH_USER,
        password=SSH_PASSWORD,
        timeout=15,
        allow_agent=False,
        look_for_keys=False,
    )
    return client


def sftp_mkdirs(sftp: paramiko.SFTPClient, remote_dir: str) -> None:
    """递归创建远程目录 (类似mkdir -p)。"""
    parts = [p for p in remote_dir.strip("/").split("/") if p]
    cur = ""
    for p in parts:
        cur = f"{cur}/{p}"
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            sftp.mkdir(cur)


def upload_tar(local_path: Path, remote_dir: str, dry_run: bool) -> str:
    """通过SFTP上传tar到远程目录, 返回远程完整路径。"""
    remote_path = f"{remote_dir.rstrip('/')}/{local_path.name}"
    log(f"SFTP 上传: {local_path} -> {SSH_USER}@{SSH_HOST}:{remote_path}")
    if dry_run:
        return remote_path

    client = open_ssh()
    try:
        sftp = client.open_sftp()
        try:
            sftp_mkdirs(sftp, remote_dir)
            sftp.put(str(local_path), remote_path)
        finally:
            sftp.close()
    finally:
        client.close()
    return remote_path


def run_remote_once(cmd: str, cwd: str) -> None:
    """在远程主机执行一次命令并实时流式打印 stdout / stderr。"""
    log(f"REMOTE $ (cwd={cwd}) {cmd}")
    client = open_ssh()
    try:
        full_cmd = f"cd {cwd} && {cmd}"
        transport = client.get_transport()
        if transport is None:
            raise RuntimeError("SSH transport 不可用")
        channel = transport.open_session()
        channel.get_pty()
        channel.exec_command(full_cmd)

        # 流式读取输出
        while True:
            if channel.recv_ready():
                data = channel.recv(4096)
                if data:
                    sys.stdout.write(data.decode("utf-8", errors="replace"))
                    sys.stdout.flush()
            if channel.recv_stderr_ready():
                data = channel.recv_stderr(4096)
                if data:
                    sys.stderr.write(data.decode("utf-8", errors="replace"))
                    sys.stderr.flush()
            if channel.exit_status_ready():
                # 排空剩余缓冲
                while channel.recv_ready():
                    data = channel.recv(4096)
                    if data:
                        sys.stdout.write(data.decode("utf-8", errors="replace"))
                        sys.stdout.flush()
                while channel.recv_stderr_ready():
                    data = channel.recv_stderr(4096)
                    if data:
                        sys.stderr.write(data.decode("utf-8", errors="replace"))
                        sys.stderr.flush()
                break

        exit_code = channel.recv_exit_status()
        channel.close()
        if exit_code != 0:
            raise RuntimeError(f"远程命令失败 (exit={exit_code}): {cmd}")
    finally:
        client.close()


def run_remote(cmd: str, cwd: str, dry_run: bool) -> None:
    """执行远程命令，失败时允许用户重试当前命令。"""
    if dry_run:
        log(f"REMOTE $ (cwd={cwd}) {cmd}")
        return

    while True:
        try:
            run_remote_once(cmd, cwd)
            return
        except Exception as e:
            print(f"[deploy] {e}", file=sys.stderr)
            if not prompt_retry():
                raise
            log("重新执行当前远程命令")


def get_current_tag(values: dict, name: str) -> str:
    image_section = values.get("image")
    if not isinstance(image_section, dict):
        raise RuntimeError("values.yaml 中缺少 image 段")
    if name not in image_section:
        raise RuntimeError(f"image 段中未找到键: {name}")
    tag = image_section[name]
    if not isinstance(tag, str):
        raise RuntimeError(f"image.{name} 不是字符串: {tag!r}")
    return tag


# ---------- 版本递增 ----------

@dataclass
class BumpResult:
    old_tag: str
    new_tag: str
    image_name: str
    date_changed: bool
    old_seq: int
    new_seq: int


def bump_tag(old_tag: str, today: str) -> BumpResult:
    """按规则计算新tag。today形如260716。"""
    m = TAG_RE.match(old_tag.strip())
    if not m:
        raise RuntimeError(f"无法解析当前 tag 格式: {old_tag!r}")

    image_name = m.group("image")
    major = m.group("major")
    date = m.group("date")
    seq_str = m.group("seq")
    old_seq = int(seq_str)

    if date == today:
        new_seq = old_seq + 1
        width = max(len(seq_str), 2)
        new_seq_str = str(new_seq).zfill(width)
        new_date = date
        date_changed = False
    else:
        new_seq = 1
        new_seq_str = "01"
        new_date = today
        date_changed = True

    new_tag = f"{REGISTRY_NEW}/{image_name}:{major}-{new_date}.{new_seq_str}"
    return BumpResult(
        old_tag=old_tag,
        new_tag=new_tag,
        image_name=image_name,
        date_changed=date_changed,
        old_seq=old_seq,
        new_seq=new_seq,
    )


# ---------- 本地目录定位 ----------

def locate_app_dir(input_name: str) -> Path:
    """在 WEB2_ROOT 下定位应用目录。

    webHost -> WEB2_ROOT/host/
    webQualityControl -> WEB2_ROOT/remote/quality-control/
    webVisit -> WEB2_ROOT/share/visit/
    """
    if not WEB2_ROOT.is_dir():
        raise RuntimeError(f"web2 根目录不存在: {WEB2_ROOT}")

    suffix = strip_web_prefix(input_name)
    kebab = camel_to_kebab(suffix)

    candidates: list[Path] = []
    if input_name == "webHost":
        candidates.append(WEB2_ROOT / "host")
    candidates.append(WEB2_ROOT / "remote" / kebab)
    candidates.append(WEB2_ROOT / "share" / kebab)

    for c in candidates:
        if c.is_dir():
            return c

    tried = "\n  - ".join(str(c) for c in candidates)
    raise RuntimeError(f"未找到 {input_name} 对应的本地目录，尝试过:\n  - {tried}")


# ---------- 子进程执行 ----------

def run_cmd(cmd: list[str], cwd: Path | None = None, dry_run: bool = False) -> None:
    display_cwd = str(cwd) if cwd else str(Path.cwd())
    if dry_run:
        log(f"$ (cwd={display_cwd}) {' '.join(cmd)}")
        return

    while True:
        log(f"$ (cwd={display_cwd}) {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, cwd=str(cwd) if cwd else None)
            if result.returncode == 0:
                return
            error = RuntimeError(
                f"命令执行失败 (exit={result.returncode}): {' '.join(cmd)}"
            )
        except OSError as e:
            error = RuntimeError(f"命令无法启动: {' '.join(cmd)} ({e})")

        print(f"[deploy] {error}", file=sys.stderr)
        if not prompt_retry():
            raise error
        log("重新执行当前命令")


# ---------- 单个应用完整流程 ----------

def process_one(input_name: str, values: dict, today: str, dry_run: bool) -> None:
    log(f"===== 开始处理 {input_name} =====")

    old_tag = get_current_tag(values, input_name)
    log(f"当前 tag: {old_tag}")

    bump = bump_tag(old_tag, today)
    log(
        f"新 tag: {bump.new_tag} "
        f"({'日期更新→序号重置为 01' if bump.date_changed else f'日期同今日→序号 {bump.old_seq}→{bump.new_seq}'})"
    )

    app_dir = locate_app_dir(input_name)
    log(f"本地目录: {app_dir}")

    # 先按 lockfile 严格安装依赖, 保证不同机器构建产物一致(避免 ^ 版本漂移导致的 MF CSS 等差异)
    run_cmd(["npm", "ci"], cwd=app_dir, dry_run=dry_run)

    run_cmd(["npm", "run", "build"], cwd=app_dir, dry_run=dry_run)

    run_cmd(
        [
            "docker", "build",
            "--platform", "linux/amd64",
            "-t", bump.new_tag,
            ".",
        ],
        cwd=app_dir,
        dry_run=dry_run,
    )

    run_cmd(
        [
            "docker", "login",
            "-u", REGISTRY_USER,
            "-p", REGISTRY_PASSWORD,
            REGISTRY_NEW,
        ],
        dry_run=dry_run,
    )

    run_cmd(["docker", "push", bump.new_tag], dry_run=dry_run)

    if not dry_run:
        DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    tar_name = f"{input_name_to_tar_stem(input_name)}.tar"
    tar_local_path = DOWNLOADS_DIR / tar_name
    run_cmd(
        ["docker", "save", "-o", tar_name, bump.new_tag],
        cwd=DOWNLOADS_DIR,
        dry_run=dry_run,
    )

    remote_tar_path = upload_tar(tar_local_path, REMOTE_TAR_DIR, dry_run=dry_run)

    log(f"===== {input_name} 完成: 本地 {tar_local_path} / 远程 {remote_tar_path} =====\n")


def finalize_remote(dry_run: bool) -> None:
    """所有tar上传完成后, 在服务器根目录执行脚本make push,然后执行make。"""
    log(f"===== 开始远程部署: {SSH_USER}@{SSH_HOST}:{REMOTE_MAKE_DIR} =====")
    run_remote("make push", cwd=REMOTE_MAKE_DIR, dry_run=dry_run)
    run_remote("make", cwd=REMOTE_MAKE_DIR, dry_run=dry_run)
    log("===== 远程部署完成 =====")


# ---------- CLI ----------

def parse_names(raw: str) -> list[str]:
    names = [n.strip() for n in raw.split(",")]
    names = [n for n in names if n]
    if not names:
        raise ValueError("输入名称为空")
    return names


def main() -> int:
    parser = argparse.ArgumentParser(
        description="前端应用构建 + 推送 + 打包 tar 部署脚本",
    )
    parser.add_argument(
        "names",
        help="应用名称, 逗号分隔, 例如 webHost,webQualityControl",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅打印将要执行的命令, 不真正执行",
    )
    args = parser.parse_args()

    try:
        names = parse_names(args.names)
    except ValueError as e:
        print(f"参数错误: {e}", file=sys.stderr)
        return 2

    log(f"待处理列表: {names}")
    log(f"web2 根目录: {WEB2_ROOT}")
    if args.dry_run:
        log("*** DRY-RUN 模式, 不会真正执行命令 ***")

    today = datetime.now().strftime("%y%m%d")
    log(f"今日日期段: {today}")

    try:
        values = fetch_remote_yaml()
    except Exception as e:
        print(f"读取远程 values.yaml 失败: {e}", file=sys.stderr)
        return 1

    for name in names:
        try:
            process_one(name, values, today, args.dry_run)
        except Exception as e:
            print(f"[deploy] 处理 {name} 失败: {e}", file=sys.stderr)
            print("[deploy] 立即终止, 后续任务不再执行", file=sys.stderr)
            return 1

    try:
        finalize_remote(args.dry_run)
    except Exception as e:
        print(f"[deploy] 远程部署失败: {e}", file=sys.stderr)
        return 1

    log("全部处理完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
