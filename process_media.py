import os
import shutil
import glob
from PIL import Image
from pillow_heif import register_heif_opener
from moviepy.editor import VideoFileClip

register_heif_opener()

base_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds"
src_images_dir = os.path.join(base_dir, "Grounds-20260329T092655Z-1-001", "Grounds", "Before and After")
src_videos_dir = os.path.join(base_dir, "Grounds-20260329T092655Z-1-001", "Grounds")
src_brand_dir = os.path.join(base_dir, "grounds-logo-favicon-pack")

dest_assets = os.path.join(base_dir, "argrounds-website", "argrounds-final", "assets")
dest_gallery = os.path.join(dest_assets, "gallery")
dest_video = os.path.join(dest_assets, "video")
dest_brand = os.path.join(dest_assets, "brand")

os.makedirs(dest_gallery, exist_ok=True)
os.makedirs(dest_video, exist_ok=True)
os.makedirs(dest_brand, exist_ok=True)

# 1. Process HEIC Images
heic_files = glob.glob(os.path.join(src_images_dir, "*.heic")) + glob.glob(os.path.join(src_images_dir, "*.HEIC"))
for f in heic_files:
    try:
        img = Image.open(f)
        # Resize to max 1920 to save size
        img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
        
        base_name = os.path.splitext(os.path.basename(f))[0]
        out_path = os.path.join(dest_gallery, f"{base_name}.webp")
        img.save(out_path, "WEBP", quality=80)
        print(f"Saved: {out_path}")
    except Exception as e:
        print(f"Error processing image {f}: {e}")

# 2. Process MOV Videos -> mp4
mov_files = glob.glob(os.path.join(src_videos_dir, "*.MOV")) + glob.glob(os.path.join(src_videos_dir, "*.mov"))
for f in mov_files:
    try:
        base_name = os.path.splitext(os.path.basename(f))[0]
        out_path = os.path.join(dest_video, f"{base_name}.mp4")
        if not os.path.exists(out_path):  # basic caching
            print(f"Converting video: {f}")
            clip = VideoFileClip(f)
            # Remove audio and compress strongly
            clip = clip.without_audio()
            # If large, can resize. Given they are 1MB, they're probably short.
            clip.write_videofile(out_path, codec="libx264", bitrate="1M", preset="fast", logger=None, audio=False)
            print(f"Saved: {out_path}")
    except Exception as e:
        print(f"Error processing video {f}: {e}")

# 3. Copy Brand Assets
brand_files = glob.glob(os.path.join(src_brand_dir, "*.*"))
for f in brand_files:
    try:
        shutil.copy2(f, dest_brand)
        name = os.path.basename(f)
        # Also copy favicons to the root directory for easier head paths
        if name.startswith("favicon") or name in ["site.webmanifest", "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png"]:
            shutil.copy2(f, os.path.join(base_dir, "argrounds-website", "argrounds-final"))
    except Exception as e:
        print(f"Error copying brand file {f}: {e}")

print("Media processing completed!")
