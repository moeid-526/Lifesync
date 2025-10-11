import sys
import os
import cv2
import numpy as np
from cryptosteganography import CryptoSteganography

def encode_image(input_path, output_path, secret):
    """Encodes secret message into image"""
    try:
        crypto = CryptoSteganography('LIFESYNC_SECRET')
        crypto.hide(input_path, output_path, secret)
        print(f"Image encoded successfully: {os.path.basename(output_path)}")
        return True
    except Exception as e:
        print(f"Image encoding failed: {str(e)}", file=sys.stderr)
        return False

import subprocess

def encode_video(input_path, output_path, secret):
    """Encodes secret message into video (frame 10) and retains audio via FFmpeg"""
    try:
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Failed to open video file")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if total_frames < 10:
            raise ValueError(f"Video too short (only {total_frames} frames)")

        temp_video_path = "temp_video.avi"
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        writer = cv2.VideoWriter(temp_video_path, fourcc, fps, (width, height))

        if not writer.isOpened():
            raise ValueError("Failed to initialize video writer")

        frame_idx = 0
        font = cv2.FONT_HERSHEY_SIMPLEX
        text_position = (int(width*0.05), int(height*0.95))
        font_scale = min(width, height) / 1000
        thickness = max(1, int(min(width, height) / 500))

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx == 9:
                cv2.putText(frame, secret, text_position, font, font_scale, (0, 0, 255), thickness, cv2.LINE_AA)
            writer.write(frame)
            frame_idx += 1

        cap.release()
        writer.release()

        # Recombine with original audio using FFmpeg
        ffmpeg_cmd = [
    "ffmpeg",
    "-y",
    "-i", temp_video_path,
    "-i", input_path,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-strict", "experimental",
    "-map", "0:v:0",
    "-map", "1:a:0?",
    "-movflags", "+faststart",
    output_path
]

        result = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr.decode()}", file=sys.stderr)
            raise RuntimeError("FFmpeg muxing failed")

        os.remove(temp_video_path)
        print(f"Video encoded with audio successfully: {os.path.basename(output_path)}")
        return True

    except Exception as e:
        print(f"Video encoding failed: {str(e)}", file=sys.stderr)
        if os.path.exists(output_path):
            os.remove(output_path)
        return False


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python steganography.py [encode-image|encode-video] <input> <output> <secret>", 
              file=sys.stderr)
        sys.exit(1)

    mode = sys.argv[1]
    input_path = sys.argv[2]
    output_path = sys.argv[3]
    secret = sys.argv[4]

    if not os.path.exists(input_path):
        print(f"Input file does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)

    success = False
    try:
        if mode == "encode-image":
            success = encode_image(input_path, output_path, secret)
        elif mode == "encode-video":
            success = encode_video(input_path, output_path, secret)
        else:
            print(f"Invalid mode: {mode}. Use 'encode-image' or 'encode-video'", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0 if success else 1)