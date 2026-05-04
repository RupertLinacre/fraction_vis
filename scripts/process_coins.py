# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "numpy>=1.26",
#   "Pillow>=10.0",
# ]
# ///

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def chromakey_alpha(rgb: np.ndarray) -> np.ndarray:
    """Return alpha values after removing a bright green screen background."""
    rgb_f = rgb.astype(np.float32)
    red = rgb_f[:, :, 0]
    green = rgb_f[:, :, 1]
    blue = rgb_f[:, :, 2]

    green_strength = green - np.maximum(red, blue)
    hard_green = (green > 80) & (green_strength > 35) & (green > red * 1.25) & (green > blue * 1.25)

    alpha = np.full(rgb.shape[:2], 255, dtype=np.uint8)
    alpha[hard_green] = 0

    # Soften green anti-aliasing around coin edges instead of leaving a hard fringe.
    soft_edge = (green > 55) & (green_strength > 10) & (green > red * 1.05) & (green > blue * 1.05)
    edge_strength = np.clip((green_strength - 10) / 45, 0, 1)
    alpha[soft_edge] = np.minimum(alpha[soft_edge], ((1 - edge_strength[soft_edge]) * 255).astype(np.uint8))
    return alpha


def fill_small_holes(mask: np.ndarray) -> np.ndarray:
    """Fill transparent holes fully enclosed by coin pixels."""
    height, width = mask.shape
    outside = np.zeros_like(mask, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if not mask[0, x]:
            queue.append((0, x))
        if not mask[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if not mask[y, 0]:
            queue.append((y, 0))
        if not mask[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if outside[y, x] or mask[y, x]:
            continue
        outside[y, x] = True
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and not outside[ny, nx] and not mask[ny, nx]:
                queue.append((ny, nx))

    return mask | ~outside


def connected_components(mask: np.ndarray, min_area: int) -> list[tuple[int, int, int, int, int]]:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components: list[tuple[int, int, int, int, int]] = []

    ys, xs = np.nonzero(mask)
    for start_y, start_x in zip(ys, xs):
        if visited[start_y, start_x]:
            continue

        queue: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        area = 0
        y_min = y_max = int(start_y)
        x_min = x_max = int(start_x)

        while queue:
            y, x = queue.popleft()
            area += 1
            y_min = min(y_min, y)
            y_max = max(y_max, y)
            x_min = min(x_min, x)
            x_max = max(x_max, x)

            for ny, nx in (
                (y - 1, x),
                (y + 1, x),
                (y, x - 1),
                (y, x + 1),
                (y - 1, x - 1),
                (y - 1, x + 1),
                (y + 1, x - 1),
                (y + 1, x + 1),
            ):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

        if area >= min_area:
            components.append((x_min, y_min, x_max + 1, y_max + 1, area))

    return sorted(components, key=lambda box: (box[1], box[0]))


def process_coins(
    input_path: Path,
    output_dir: Path,
    padding: int,
    min_area: int,
    names: list[str] | None,
) -> None:
    image = Image.open(input_path).convert("RGB")
    rgb = np.array(image)
    alpha = chromakey_alpha(rgb)
    object_mask = fill_small_holes(alpha > 18)
    components = connected_components(object_mask, min_area=min_area)

    output_dir.mkdir(parents=True, exist_ok=True)
    for old_png in output_dir.glob("*.png"):
        old_png.unlink()

    rgba = np.dstack([rgb, np.where(object_mask, alpha, 0).astype(np.uint8)])
    manifest = []
    height, width = object_mask.shape

    if names is not None and len(names) != len(components):
        raise ValueError(f"Got {len(names)} output names but found {len(components)} coins")

    for index, (x1, y1, x2, y2, area) in enumerate(components, start=1):
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(width, x2 + padding)
        y2 = min(height, y2 + padding)

        coin = Image.fromarray(rgba[y1:y2, x1:x2], mode="RGBA")
        filename = f"{names[index - 1]}.png" if names is not None else f"coin_{index:02d}.png"
        coin.save(output_dir / filename)
        manifest.append(
            {
                "file": filename,
                "bounds": [x1, y1, x2, y2],
                "area": area,
            }
        )

    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Processed {len(components)} coins into {output_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract individual coins from a green-screen PNG.")
    parser.add_argument("--input", type=Path, default=Path("coins.png"))
    parser.add_argument("--output", type=Path, default=Path("public/coin_images"))
    parser.add_argument("--padding", type=int, default=12)
    parser.add_argument("--min-area", type=int, default=2_500)
    parser.add_argument(
        "--names",
        help="Comma-separated output names without .png, in top-left to bottom-right component order.",
    )
    args = parser.parse_args()

    names = [name.strip() for name in args.names.split(",")] if args.names else None
    process_coins(args.input, args.output, padding=args.padding, min_area=args.min_area, names=names)


if __name__ == "__main__":
    main()
