import requests
import os

API_URL = os.getenv("API_URL", "http://localhost:8000")
EMPRESAS = ["default", "empresa_a", "empresa_b"]
LOGIN_USER = os.getenv("LOGIN_USER", "admin")
LOGIN_PASS = os.getenv("LOGIN_PASS", "senha")


def login(empresa: str):
    resp = requests.post(
        f"{API_URL}/auth/login",
        headers={"X-Empresa": empresa},
        data={"username": LOGIN_USER, "password": LOGIN_PASS}
    )
    if resp.status_code != 200:
        return None, f"Falha login {empresa}: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    return token, None


def get_root(token: str, empresa: str):
    resp = requests.get(
        f"{API_URL}/",
        headers={"Authorization": f"Bearer {token}", "X-Empresa": empresa}
    )
    content_type = resp.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        try:
            return resp.status_code, resp.json()
        except Exception:
            return resp.status_code, {"raw": resp.text}
    return resp.status_code, resp.text


def main():
    results = []
    for empresa in EMPRESAS:
        token, err = login(empresa)
        if err:
            results.append((empresa, "ERRO_LOGIN", err))
            continue
        status, data = get_root(token, empresa)
        results.append((empresa, status, data))

    print("\n=== RESULTADOS ===")
    for empresa, status, data in results:
        print(f"Empresa: {empresa} | Status: {status}\n  Data: {data}\n")

    falhas = [r for r in results if r[1] != 200]
    if falhas:
        print(f"Falhas detectadas: {len(falhas)}")
        exit(1)
    print("Sucesso em todas as empresas testadas.")

if __name__ == "__main__":
    main()
