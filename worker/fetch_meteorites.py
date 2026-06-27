#!/usr/bin/env python3
import os
import json
import requests
from datetime import datetime
from groq import Groq
from botocore.config import Config
from botocore.exceptions import NoCredentialsError
import boto3

# Konfigurasi
NASA_API_KEY = os.getenv("NASA_API_KEY", "hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "5f29e48300ae379ebe15c20185d15ac8")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "cd3b2f027722b69c38f2f9ebf3663228")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "5e2207a33647f195c2616ebb6f2ad4b8c421c629756c9459186b8988af1a8073")
R2_BUCKET_NAME = "meteorit-indonesia"
R2_PUBLIC_URL = os.getenv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev")

# Inisialisasi klien Groq untuk terjemahan
client = Groq(api_key=GROQ_API_KEY)

# Inisialisasi klien Cloudflare R2
r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
)

def translate_text(text: str, target_language: str = "id") -> str:
    """Menerjemahkan teks menggunakan Groq API."""
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"Terjemahkan teks berikut ke bahasa {target_language}.",
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            model="mixtral-8x7b-32768",
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error menerjemahkan teks: {e}")
        return text

def download_image(url: str, save_path: str) -> bool:
    """Mengunduh gambar dari URL dan menyimpannya ke path lokal."""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(save_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Error mengunduh gambar: {e}")
        return False

def upload_to_r2(file_path: str, object_name: str) -> bool:
    """Mengunggah file ke Cloudflare R2."""
    try:
        r2.upload_file(file_path, R2_BUCKET_NAME, object_name)
        return True
    except NoCredentialsError:
        print("Kredensial R2 tidak valid.")
        return False
    except Exception as e:
        print(f"Error mengunggah ke R2: {e}")
        return False

def fetch_meteorites():
    """Mengambil data meteorit dari NASA API, menerjemahkan, dan menyimpan ke R2."""
    try:
        # Ambil data dari NASA API
        response = requests.get(
            f"https://data.nasa.gov/resource/gh4g-9sfh.json?$limit=1000&api_key={NASA_API_KEY}"
        )
        response.raise_for_status()
        meteorites = response.json()

        # Proses setiap meteorit
        for meteorite in meteorites:
            try:
                # Terjemahkan nama dan deskripsi
                name = meteorite.get("name", "Unknown")
                translated_name = translate_text(name)
                
                # Simpan data meteorit
                meteorite_data = {
                    "id": meteorite.get("id", ""),
                    "name": name,
                    "translated_name": translated_name,
                    "mass": meteorite.get("mass", "0"),
                    "year": meteorite.get("year", ""),
                    "recclass": meteorite.get("recclass", ""),
                    "lat": meteorite.get("reclat", "0"),
                    "long": meteorite.get("reclong", "0"),
                    "description": "",
                    "translated_description": "",
                    "image_url": "",
                }

                # Jika ada gambar, unduh dan unggah ke R2
                if "name" in meteorite:
                    image_url = f"https://nasa.gov/images/meteorites/{name}.jpg"  # Contoh URL gambar
                    image_path = f"/tmp/{name}.jpg"
                    if download_image(image_url, image_path):
                        object_name = f"meteorites/images/{name}.jpg"
                        if upload_to_r2(image_path, object_name):
                            meteorite_data["image_url"] = f"{R2_PUBLIC_URL}/{object_name}"
                        os.remove(image_path)  # Hapus file lokal setelah diunggah

                # Simpan data meteorit ke R2
                object_name = f"meteorites/data/{name}.json"
                with open(f"/tmp/{name}.json", "w") as f:
                    json.dump(meteorite_data, f)
                upload_to_r2(f"/tmp/{name}.json", object_name)
                os.remove(f"/tmp/{name}.json")  # Hapus file lokal

                print(f"Berhasil memproses meteorit: {name}")

            except Exception as e:
                print(f"Error memproses meteorit {meteorite.get('name', 'Unknown')}: {e}")

    except Exception as e:
        print(f"Error mengambil data dari NASA API: {e}")

if __name__ == "__main__":
    fetch_meteorites()