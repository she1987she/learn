from gtts import gTTS
import os
import zipfile

# 26 個英文字母
english_list = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]

output_dir = "tts_english_audio"
os.makedirs(output_dir, exist_ok=True)

# 批次合成語音
for char in english_list:
    tts = gTTS(text=char, lang="en", slow=False)
    filepath = os.path.join(output_dir, f"{char}.mp3")
    tts.save(filepath)

# 壓縮成zip檔案
zip_path = "English_Alphabet_Audio.zip"
with zipfile.ZipFile(zip_path, 'w') as zipf:
    for file_name in os.listdir(output_dir):
        full_path = os.path.join(output_dir, file_name)
        zipf.write(full_path, file_name)

print(f"合成完成，壓縮檔位於：{zip_path}")