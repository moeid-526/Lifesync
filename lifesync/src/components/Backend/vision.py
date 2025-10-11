from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from flask_cors import CORS
import numpy as np
import os
import cv2
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'mov', 'avi'}

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load model (global for reuse)
try:
    model = load_model('vision_guard_model.h5')
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    exit(1)

# Allowed file check
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Predict on a single image
def predict_nsfw(image_path):
    try:
        print(f"🔍 Predicting NSFW score for image: {image_path}")
        img = image.load_img(image_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0) / 255.0
        prediction = float(model.predict(img_array)[0][0])
        print(f"✅ Image prediction score: {prediction:.4f}")
        return prediction
    except Exception as e:
        print(f"❌ Prediction error (image): {e}")
        return 0.5

# Extract N frames from a video
def extract_frames_from_video(video_path, num_frames=10):
    try:
        print(f"🎞️ Starting frame extraction from video: {video_path}")
        frames = []
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        interval = max(total_frames // num_frames, 1)

        for i in range(0, total_frames, interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if ret:
                frame = cv2.resize(frame, (224, 224))
                frames.append(frame)
            if len(frames) >= num_frames:
                break
        cap.release()
        print(f"✅ Extracted {len(frames)} frames from video.")
        return frames
    except Exception as e:
        print(f"❌ Video frame extraction error: {e}")
        return []

# Predict NSFW score for video using average of sampled frames
def predict_nsfw_for_video(video_path):
    print("🧠 Running prediction on video frames...")
    frames = extract_frames_from_video(video_path)
    if not frames:
        print("⚠️ No frames extracted, returning default score 0.5")
        return 0.5
    batch = np.array(frames, dtype=np.float32) / 255.0
    preds = model.predict(batch)
    average_score = float(np.mean(preds))
    print(f"✅ Video prediction average score: {average_score:.4f}")
    return average_score

@app.route('/scan', methods=['POST'])
def handle_scan():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        extension = filename.rsplit('.', 1)[1].lower()
        print(f"\n📂 File uploaded: {filename} ({extension})")

        if extension in {'png', 'jpg', 'jpeg'}:
            print("🖼️ Detected image. Starting image scan...")
            nsfw_score = predict_nsfw(filepath)
        else:
            print("🎥 Detected video. Starting video scan...")
            nsfw_score = predict_nsfw_for_video(filepath)

        os.remove(filepath)
        print(f"🗑️ Temp file deleted: {filename}")

        is_nsfw = nsfw_score < 0.19
        print(f"🧾 Final decision: {'NSFW ❌' if is_nsfw else 'Neutral ✅'}\n")

        return jsonify({
            'is_nsfw': is_nsfw,
            'score': round(nsfw_score, 4)
        })

    except Exception as e:
        print(f"❌ Scan error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=True)
