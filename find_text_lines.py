from PIL import Image

plate = Image.open("card/plate.webp").convert("RGBA")
W, H = plate.size

# Scan for text lines in x: 100 to 200, y: 750 to 1200
for y in range(750, 1200, 10):
    # count dark pixels
    dark = sum(1 for x in range(80, 450) if plate.getpixel((x, y))[0] < 50)
    if dark > 20:
        print(f"y: {y} has {dark} dark pixels")

