#!/usr/bin/env python3
import os
import json
import requests
import sys

# Load environment variables dari .env files
def load_env():
    env = {}
    for filename in ['.env.local', '.env.production.local']:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, val = line.split('=', 1)
                        val = val.strip('"\'')
                        env[key] = val
    return env

env = load_env()
GROQ_API_KEY = env.get("GROQ_API_KEY") or os.getenv("GROQ_API_KEY")
CRON_SECRET = env.get("CRON_SECRET") or os.getenv("CRON_SECRET") or "UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU="
R2_PUBLIC_URL = env.get("R2_PUBLIC_URL") or env.get("NEXT_PUBLIC_R2_PUBLIC_URL") or "https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev"
SITE_URL = env.get("NEXT_PUBLIC_SITE_URL") or env.get("NEXT_PUBLIC_APP_URL") or "http://localhost:3000"

if not GROQ_API_KEY:
    print("Error: GROQ_API_KEY tidak ditemukan di environment maupun .env files.")
    sys.exit(1)

def translate_article(title, excerpt, content):
    """
    Menerjemahkan judul, ringkasan, dan konten artikel ke dalam 4 bahasa sekaligus dalam satu call LLM.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""Translate this Indonesian science article title, excerpt, and content (written in Markdown) into four target languages: English (en), Bahasa Melayu (ms), Mandarin Chinese (zh), and Japanese (ja).
    
Article Title: {title}
Article Excerpt: {excerpt}
Article Content:
{content}

You must return ONLY a valid JSON object matching this schema structure:
{{
  "en": {{
    "title": "translated title in English",
    "excerpt": "translated excerpt in English",
    "content": "translated content in English (keep Markdown structure)"
  }},
  "ms": {{
    "title": "translated title in Bahasa Melayu",
    "excerpt": "translated excerpt in Bahasa Melayu",
    "content": "translated content in Bahasa Melayu (keep Markdown structure)"
  }},
  "zh": {{
    "title": "translated title in Mandarin Chinese",
    "excerpt": "translated excerpt in Mandarin Chinese",
    "content": "translated content in Mandarin Chinese (keep Markdown structure)"
  }},
  "ja": {{
    "title": "translated title in Japanese",
    "excerpt": "translated excerpt in Japanese",
    "content": "translated content in Japanese (keep Markdown structure)"
  }}
}}

Return ONLY the raw JSON string. Do not include markdown code block syntax (like ```json) or any explanations.
"""
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": "You are a professional scientific translator. Keep Markdown structure intact and output only raw JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.25,
        "response_format": {"type": "json_object"}
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=40)
    response.raise_for_status()
    data = response.json()
    raw_content = data["choices"][0]["message"]["content"].strip()
    return json.loads(raw_content.replace("```json", "").replace("```", "").strip())

def main():
    print("=== Memulai Python Translation Worker ===")
    
    # 1. Unduh posts.json dari R2 untuk mendeteksi artikel yang perlu diterjemahkan
    posts_url = f"{R2_PUBLIC_URL}/data/blog/posts.json"
    print(f"Mengunduh katalog artikel dari R2: {posts_url}")
    
    try:
        res = requests.get(posts_url, timeout=15)
        res.raise_for_status()
        posts = res.json()
    except Exception as e:
        print(f"Gagal mengunduh katalog dari R2: {e}")
        return

    untranslated_posts = []
    for post in posts:
        translations = post.get("translations", {})
        languages = ["en", "ms", "zh", "ja"]
        is_missing = False
        for lang in languages:
            if lang not in translations or not translations[lang] or not translations[lang].get("title"):
                is_missing = True
                break
        if is_missing:
            untranslated_posts.append(post)
            
    print(f"Menemukan {len(untranslated_posts)} artikel yang membutuhkan terjemahan.")
    
    for idx, post in enumerate(untranslated_posts):
        post_id = post.get("id")
        title = post.get("title")
        excerpt = post.get("excerpt", "")
        content = post.get("content", "")
        
        print(f"\n[{idx+1}/{len(untranslated_posts)}] Menerjemahkan artikel: '{title}' (ID: {post_id})...")
        
        try:
            # Eksekusi AI translation
            translations_result = translate_article(title, excerpt, content)
            
            # Format payload untuk sinkronisasi ke Next.js
            sync_payload = {
                "id": post_id,
                "type": "articles",
                "translations": translations_result
            }
            
            # Kirim data ke sync endpoint Next.js
            sync_url = f"{SITE_URL}/api/cron/translate?secret={CRON_SECRET}"
            print(f"Mengirim terjemahan ke sync endpoint: {SITE_URL}/api/cron/translate")
            
            sync_res = requests.post(sync_url, json=sync_payload, timeout=25)
            sync_res.raise_for_status()
            
            sync_result = sync_res.json()
            if sync_result.get("success"):
                print(f"Sukses menerjemahkan & sinkronisasi artikel '{title}' ke Firestore & R2.")
            else:
                print(f"Gagal sinkronisasi terjemahan ke database: {sync_result.get('error')}")
                
        except Exception as e:
            print(f"Gagal menerjemahkan artikel {post_id}: {e}")

    print("\n=== Proses Translasi Selesai ===")

if __name__ == "__main__":
    main()
