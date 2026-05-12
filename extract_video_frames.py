from __future__ import annotations

import argparse
from pathlib import Path

import cv2


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--out", type=Path, default=Path("video_frames"))
    parser.add_argument("--frames", type=int, default=16)
    parser.add_argument("--sheet", type=Path)
    args = parser.parse_args()

    cap = cv2.VideoCapture(str(args.video))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {args.video}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if frame_count else 0

    args.out.mkdir(parents=True, exist_ok=True)
    samples = []
    if frame_count <= 0:
        samples = [0]
    else:
        usable = max(frame_count - 1, 1)
        samples = [round((usable * i) / max(args.frames - 1, 1)) for i in range(args.frames)]

    saved = []
    sheet_frames = []
    for index, frame_no in enumerate(samples):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
        ok, frame = cap.read()
        if not ok:
            continue

        timestamp = frame_no / fps
        label = f"frame_{index:02d}_{timestamp:06.2f}s.jpg"
        out_path = args.out / label
        cv2.imwrite(str(out_path), frame)
        saved.append((timestamp, out_path))
        sheet_frames.append((timestamp, frame))

    cap.release()

    if args.sheet and sheet_frames:
        thumb_w = 320
        thumb_h = 180
        cols = 6
        rows = (len(sheet_frames) + cols - 1) // cols
        sheet = 255 * cv2.UMat(rows * thumb_h, cols * thumb_w, cv2.CV_8UC3).get()

        for index, (timestamp, frame) in enumerate(sheet_frames):
            row = index // cols
            col = index % cols
            thumb = cv2.resize(frame, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
            cv2.rectangle(thumb, (0, 0), (112, 26), (0, 0, 0), -1)
            cv2.putText(
                thumb,
                f"{timestamp:05.1f}s",
                (8, 19),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.62,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )
            sheet[
                row * thumb_h : (row + 1) * thumb_h,
                col * thumb_w : (col + 1) * thumb_w,
            ] = thumb

        cv2.imwrite(str(args.sheet), sheet)

    print(f"fps={fps:.3f}")
    print(f"frames={frame_count}")
    print(f"duration={duration:.3f}")
    for timestamp, out_path in saved:
        print(f"{timestamp:7.3f}s {out_path}")
    if args.sheet:
        print(f"sheet={args.sheet}")


if __name__ == "__main__":
    main()
