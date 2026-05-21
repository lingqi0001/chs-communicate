import urllib.request

url = "http://127.0.0.1:8000/extensions/school/ir-navigator/"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=2) as response:
        html = response.read().decode('utf-8', errors='ignore')
        print("HTML for subfolder:")
        print(html)
except Exception as e:
    print(f"Failed: {e}")
