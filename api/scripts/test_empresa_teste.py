import requests
import os

API = os.getenv("API_URL", "http://127.0.0.1:8000")
EMPRESA = os.getenv("EMPRESA", "teste")
USER = os.getenv("LOGIN_USER", "admin")
PASS = os.getenv("LOGIN_PASS", "admin123")


def main():
    print("[1/2] Login...")
    r = requests.post(f"{API}/auth/login", headers={"X-Empresa": EMPRESA}, data={"username": USER, "password": PASS})
    print("Status:", r.status_code)
    if not r.ok:
        print("Resposta:", r.text)
        raise SystemExit(1)
    token = r.json()["access_token"]

    print("[2/2] Listar produtos...")
    r = requests.get(f"{API}/produtos", headers={"Authorization": f"Bearer {token}", "X-Empresa": EMPRESA})
    print("Status:", r.status_code)
    if not r.ok:
        print("Resposta:", r.text)
        raise SystemExit(1)
    data = r.json()
    print(f"OK. {len(data)} produtos.")
    for p in data[:5]:
        print("-", p["nome"], "/ estoque:", p["estoque_total"], "/ preço:", p["preco_venda"])


if __name__ == "__main__":
    main()
