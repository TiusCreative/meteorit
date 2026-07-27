#!/usr/bin/env python3
import sys
import os
import json
import urllib.request
import urllib.parse
import ssl

# Bypass SSL verification for macOS environments
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass


# Membaca environment variables dari berkas .env / .env.local jika ada
def load_env():
    for env_file in ['.env', '.env.local', '.env.production.local']:
        if os.path.exists(env_file):
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            os.environ[parts[0].strip()] = parts[1].strip().strip('\'"')

load_env()

# Terjemahkan teks menggunakan Google Translate Free API (gtx) - 100% handal & tanpa API Key
def translate_google(text, target_lang):
    if not text:
        return ""
    # Petakan 'zh' ke 'zh-CN' untuk Google Translate
    tl = 'zh-CN' if target_lang == 'zh' else target_lang
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={tl}&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            sentences = data[0]
            translated = "".join([s[0] for s in sentences if s[0]])
            return translated.strip()
    except Exception as e:
        print(f"Error translating to {target_lang}: {e}", file=sys.stderr)
        return text

# Menerjemahkan rekaman data bencana terpadu (title, location, details)
def translate_record(record, target_lang):
    translated = record.copy()
    if 'title' in translated:
        translated['title'] = translate_google(translated['title'], target_lang)
    if 'location' in translated:
        translated['location'] = translate_google(translated['location'], target_lang)
    if 'details' in translated:
        translated['details'] = translate_google(translated['details'], target_lang)
    return translated

def main():
    if len(sys.argv) < 3:
        print("=== Meteorit Indonesia - Python Translation Utility ===")
        print("Penggunaan 1 (Teks Tunggal):")
        print("  python3 translate_data.py \"<teks_untuk_diterjemahkan>\" <kode_bahasa>")
        print("  Contoh: python3 translate_data.py \"Gempa bumi di Jawa Barat\" en")
        print("\nPenggunaan 2 (Batch File JSON):")
        print("  python3 translate_data.py --file <path_file_json> <kode_bahasa>")
        print("  Contoh: python3 translate_data.py --file data.json en")
        sys.exit(1)

    if sys.argv[1] == '--file':
        filepath = sys.argv[2]
        target_lang = sys.argv[3]
        if not os.path.exists(filepath):
            print(f"Error: Berkas {filepath} tidak ditemukan.")
            sys.exit(1)
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, list):
            print(f"Menerjemahkan {len(data)} rekaman data ke bahasa '{target_lang}'...")
            translated_data = []
            for idx, item in enumerate(data):
                title_preview = item.get('title', item.get('term', 'No Title'))
                print(f"[{idx+1}/{len(data)}] Menerjemahkan: {title_preview}")
                translated_data.append(translate_record(item, target_lang))
            
            output_filename = f"translated_{target_lang}_{os.path.basename(filepath)}"
            with open(output_filename, 'w', encoding='utf-8') as out_f:
                json.dump(translated_data, out_f, indent=2, ensure_ascii=False)
            print(f"Selesai! Berkas terjemahan disimpan ke: {output_filename}")
        else:
            print("Error: Struktur JSON harus berupa Array/List rekaman data.")
    else:
        text = sys.argv[1]
        target_lang = sys.argv[2]
        res = translate_google(text, target_lang)
        print(f"\n[Original]: {text}")
        print(f"[Translated - {target_lang}]: {res}")

if __name__ == '__main__':
    main()
