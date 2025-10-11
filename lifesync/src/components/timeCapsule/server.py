from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from encryption import encrypt_text, decrypt_text, hide_text_in_image, extract_text_from_image
import os
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["LifeSyncDB"]
capsules = db["timeCapsules"]

# Route to serve uploaded images
@app.route("/uploads/<filename>")
def get_uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# Upload time capsule
@app.route("/upload", methods=["POST"])
def upload_capsule():
    try:
        text = request.form.get("text")
        future_date = request.form.get("future_date")  # Format: YYYY-MM-DD
        image = request.files.get("image")

        # Validate inputs
        if not text or not image or not future_date:
            return jsonify({"error": "Missing required fields (text, future_date, image)"}), 400

        # Validate date format
        try:
            future_date_obj = datetime.strptime(future_date, "%Y-%m-%d")
            if future_date_obj < datetime.utcnow():
                return jsonify({"error": "Future date must be in the future!"}), 400
        except ValueError:
            return jsonify({"error": "Invalid date format! Use YYYY-MM-DD"}), 400

        # Encrypt text
        encrypted_text = encrypt_text(text)

        # Securely save image
        filename = secure_filename(image.filename)
        original_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        image.save(original_path)

        # Hide encrypted text inside the image
        hidden_image_path = os.path.join(app.config["UPLOAD_FOLDER"], f"secure_{filename}")
        hide_text_in_image(original_path, encrypted_text, hidden_image_path)

        # Store metadata in MongoDB
        capsule_data = {
            "image_path": hidden_image_path,
            "future_date": future_date,
            "created_at": datetime.utcnow().isoformat(),
        }
        capsules.insert_one(capsule_data)

        return jsonify({
            "message": "Time capsule uploaded successfully!",
            "future_date": future_date,
            "hidden_image_url": f"/uploads/secure_{filename}"
        }), 201

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

# Retrieve & open time capsule
@app.route("/open_capsule", methods=["POST"])
def open_capsule():
    try:
        image_path = request.json.get("image_path")

        # Validate input
        if not image_path:
            return jsonify({"error": "Missing image path"}), 400

        capsule = capsules.find_one({"image_path": image_path})
        if not capsule:
            return jsonify({"error": "Capsule not found"}), 404

        # Check if the capsule is unlocked
        future_date = datetime.strptime(capsule["future_date"], "%Y-%m-%d")
        if future_date > datetime.utcnow():
            return jsonify({"message": "This capsule is locked. Try again later."}), 403

        # Extract & decrypt text
        extracted_text = extract_text_from_image(image_path)
        if not extracted_text:
            return jsonify({"error": "No hidden message found in image"}), 404

        decrypted_text = decrypt_text(extracted_text)

        return jsonify({
            "message": "Capsule opened!",
            "text": decrypted_text
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error opening capsule: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
