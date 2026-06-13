import urllib.request
import urllib.error

ports = [8000, 3000, 5173, 9031]
for port in ports:
    url = f"http://127.0.0.1:{port}/extensions/school/"
    print(f"Checking {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2) as response:
            html = response.read().decode('utf-8', errors='ignore')
            print(f"SUCCESS on port {port}!")
            print("HTML Snippet:")
            print(html[:1000])
            print("="*40)
    except Exception as e:
        print(f"Failed on port {port}: {e}")
