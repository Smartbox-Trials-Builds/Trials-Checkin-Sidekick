"""Paired Supabase command polling, with end-to-end AES-GCM encryption."""
import base64
import hashlib
import json
import secrets
import time
import urllib.request
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

URL = "https://pkdhsegkujujvmnielvh.supabase.co"
KEY = "sb_publishable_cshWlLHDDsuUK3o3VwUUGA_W4pNBeZh"


def b64(data):
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def unb64(data):
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


class CloudBridge:
    def __init__(self, path):
        self.path = path
        self.state = json.loads(path.read_text()) if path.exists() else {"code": b64(secrets.token_bytes(32))}
        self.registered = False
        self.cipher = AESGCM(unb64(self.state["code"]))
        self.save()

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.state), encoding="utf-8")
        temporary.replace(self.path)

    def request(self, route, payload, token=None):
        headers = {"apikey": KEY, "Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        request = urllib.request.Request(URL + route, json.dumps(payload).encode(), headers)
        with urllib.request.urlopen(request, timeout=12) as response:
            return json.load(response)

    def authenticate(self):
        if self.state.get("expires", 0) > time.time() + 120:
            if not self.registered:
                self.rpc("register_desktop", {"p_hash": hashlib.sha256(unb64(self.state["code"])).hexdigest()}, auth=False)
                self.registered = True
            return
        if self.state.get("refresh_token"):
            session = self.request("/auth/v1/token?grant_type=refresh_token", {"refresh_token": self.state["refresh_token"]})
        else:
            session = self.request("/auth/v1/signup", {})
        self.state.update(access_token=session["access_token"], refresh_token=session["refresh_token"],
                          expires=time.time() + session["expires_in"])
        self.save()
        self.rpc("register_desktop", {"p_hash": hashlib.sha256(unb64(self.state["code"])).hexdigest()}, auth=False)
        self.registered = True

    def rpc(self, name, payload, auth=True):
        if auth:
            self.authenticate()
        return self.request("/rest/v1/rpc/sidekick_" + name, payload, self.state["access_token"])

    def decrypt(self, job):
        envelope = job["payload"]
        return json.loads(self.cipher.decrypt(unb64(envelope["iv"]), unb64(envelope["data"]), job["id"].encode()))

    def complete(self, job_id, ok, result):
        iv = secrets.token_bytes(12)
        encrypted = {"iv": b64(iv), "data": b64(self.cipher.encrypt(iv, json.dumps(result).encode(), job_id.encode()))}
        # Persist the acknowledgment locally before sending so a network failure cannot re-zip files.
        self.state["pending_ack"] = {"p_id": job_id, "p_ok": ok, "p_result": encrypted}
        self.save()
        self.flush_ack()

    def flush_ack(self):
        if self.state.get("pending_ack"):
            self.rpc("finish_zip", self.state["pending_ack"])
            self.state.pop("pending_ack", None)
            self.state.pop("active_job", None)
            self.save()

    def poll(self):
        self.flush_ack()
        if self.state.get("active_job"):
            self.complete(self.state["active_job"], False, {"error": "The helper restarted during zipping. Check the Final folder before retrying."})
        job = self.rpc("desktop_poll", {})
        if job:
            self.state["active_job"] = job["id"]
            self.save()
        return job
