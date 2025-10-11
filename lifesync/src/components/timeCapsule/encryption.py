from cryptography.fernet import Fernet
from stegano import lsb
import os

# Load the secret key
KEY_FILE = "secret.key"

# Ensure the key file exists
if not os.path.exists(KEY_FILE):
    raise FileNotFoundError("Secret key file 'secret.key' is missing. Run 'generate_key.py' first.")

with open(KEY_FILE, "rb") as key_file:
    SECRET_KEY = key_file.read()

fernet = Fernet(SECRET_KEY)

# Encrypt text
def encrypt_text(plain_text):
    return fernet.encrypt(plain_text.encode()).decode()

# Decrypt text
def decrypt_text(encrypted_text):
    try:
        return fernet.decrypt(encrypted_text.encode()).decode()
    except Exception:
        return "Decryption failed! Invalid or corrupted data."

# Hide encrypted text inside an image
def hide_text_in_image(image_path, encrypted_text, output_path):
    try:
        secret_image = lsb.hide(image_path, encrypted_text)
        secret_image.save(output_path)
        return output_path
    except Exception:
        raise ValueError("Failed to hide text in image. Ensure the image is valid.")

# Extract hidden text from an image
def extract_text_from_image(image_path):
    try:
        extracted_text = lsb.reveal(image_path)
        return extracted_text if extracted_text else None
    except Exception:
        return None
