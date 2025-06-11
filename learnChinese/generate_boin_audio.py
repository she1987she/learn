from gtts import gTTS
import os
import zipfile

# 21 個注音符號
boin_list = [
   "ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ",
    "ㄍ", "ㄎ", "ㄏ", "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ",
    "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ", "ㄧ", "ㄨ", "ㄩ",
    "ㄚ", "ㄛ", "ㄜ", "ㄝ", "ㄞ", "ㄟ", "ㄠ", "ㄡ",
    "ㄢ", "ㄣ", "ㄤ", "ㄥ", "ㄦ"
]

output_dir = "tts_boin_audio"
os.makedirs(output_dir, exist_ok=True)

# 批次合成語音
for char in boin_list:
    tts = gTTS(text=char, lang="zh-TW", slow=False)
    filepath = os.path.join(output_dir, f"{char}.mp3")
    tts.save(filepath)

# 壓縮成zip檔案
zip_path = "注音符號女聲語音包.zip"
with zipfile.ZipFile(zip_path, 'w') as zipf:
    for file_name in os.listdir(output_dir):
        full_path = os.path.join(output_dir, file_name)
        zipf.write(full_path, file_name)

print(f"合成完成，壓縮檔位於：{zip_path}")
