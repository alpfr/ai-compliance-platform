# Incident Report: aicompliance.opssightai.com Outage

**Date**: February 8, 2026
**Status**: ✅ Resolved
**Severity**: Critical — Login and authentication completely broken on production
**Environment**: GKE cluster `opssightai-cluster` (us-central1-a)

---

## Summary

The production site at `aicompliance.opssightai.com` was non-functional. Users could see the frontend but could not log in. Three root causes were identified and resolved.

---

## Issues Found

### Issue 1: Backend bcrypt crash (Critical)

**Symptom**: POST to `/auth/login` returned a 500 error with a `ValueError` traceback.

**Root Cause**: `passlib==1.7.4` is incompatible with `bcrypt>=4.1.0`. When the Docker image was built, pip installed the latest `bcrypt` (4.2.x), which introduced a breaking change in how it handles the internal `detect_wrap_bug` check. The error:

```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
```

This is a known upstream issue: passlib's bcrypt backend calls an internal verification function that triggers the new bcrypt length check, even for short passwords.

**Fix**: Pinned `bcrypt==4.0.1` in `backend/requirements.txt` — the last version compatible with `passlib==1.7.4`.

**Commit**: `417e35f68`

---

### Issue 2: No HTTPS/SSL certificate (High)

**Symptom**: `https://aicompliance.opssightai.com` failed with `SSL_ERROR_SYSCALL` — TLS handshake never completed.

**Root Cause**: The Kubernetes Ingress (`k8s/04-ingress.yaml`) had no TLS configuration. No managed certificate existed, and no static IP was reserved.

**Fix**:
1. Added a `ManagedCertificate` resource for `aicompliance.opssightai.com`
2. Reserved a global static IP (`ai-compliance-ip` → `35.244.188.231`)
3. Added `networking.gke.io/managed-certificates` and `kubernetes.io/ingress.global-static-ip-name` annotations to the Ingress
4. Added missing `/models` and `/reports` backend routes

**Pending**: DNS A record for `aicompliance.opssightai.com` must be updated from `34.8.110.6` (ephemeral) to `35.244.188.231` (static). SSL certificate will auto-provision once DNS propagates.

**Commit**: `417e35f68`

---

### Issue 3: Docker image architecture mismatch (High)

**Symptom**: New backend pods entered `CrashLoopBackOff` with `exec format error`.

**Root Cause**: The Docker image was built on Apple Silicon (ARM64) and pushed to Artifact Registry. GKE nodes run AMD64. The binary format was incompatible.

**Fix**: Rebuilt using `docker buildx` with `--platform linux/amd64` and a dedicated builder instance to ensure proper cross-compilation.

```bash
docker buildx create --name amd64builder --use
docker buildx build --platform linux/amd64 --no-cache \
  -t us-central1-docker.pkg.dev/alpfr-splunk-integration/ai-compliance-repo/backend:v2 \
  backend/ --push
```

---

### Issue 4: Wrong kubectl context (Low)

**Symptom**: `kubectl` commands returned `namespace "ai-compliance" not found`.

**Root Cause**: kubectl was connected to `neo4j-gke-cluster` instead of `opssightai-cluster`.

**Fix**:
```bash
gcloud container clusters get-credentials opssightai-cluster \
  --zone us-central1-a --project alpfr-splunk-integration
```

---

## Resolution Timeline

| Time | Action |
|------|--------|
| T+0 | Identified frontend loads but login fails with 500 error |
| T+5m | Diagnosed bcrypt/passlib incompatibility from error traceback |
| T+10m | Pinned `bcrypt==4.0.1` in requirements.txt |
| T+15m | Discovered kubectl pointed at wrong cluster, switched to `opssightai-cluster` |
| T+20m | First Docker build pushed — pods crashed with `exec format error` |
| T+25m | Rebuilt with `docker buildx --platform linux/amd64` |
| T+30m | Backend pods running, login working |
| T+35m | Added managed SSL certificate and static IP |

---

## Current State

| Component | Status |
|-----------|--------|
| Frontend (HTTP) | ✅ Working |
| Backend API | ✅ Working |
| Login (`/auth/login`) | ✅ Working |
| HTTPS/SSL | ⏳ Pending DNS update |

---

## Action Items

- [ ] **DNS Update**: Change A record for `aicompliance.opssightai.com` from `34.8.110.6` to `35.244.188.231`
- [ ] **Verify SSL**: After DNS propagates, confirm `https://aicompliance.opssightai.com` works
- [ ] **Pin all dependencies**: Consider pinning all Python packages to avoid similar issues
- [ ] **CI/CD**: Add `--platform linux/amd64` to all Docker build steps
- [ ] **Health checks**: Add a `/health` endpoint that tests database connectivity and password hashing

---

## Prevention

1. **Pin critical dependencies** — Always pin `bcrypt`, `passlib`, and other security libraries to exact versions
2. **Multi-arch builds in CI** — Always specify `--platform linux/amd64` when building for GKE
3. **Staging environment** — Test deployments in a staging namespace before production
4. **Automated smoke tests** — Run login test after each deployment
