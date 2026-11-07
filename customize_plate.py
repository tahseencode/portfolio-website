from PIL import Image, ImageDraw, ImageFont
import os

plate = Image.open("card/plate.webp").convert("RGBA")
W, H = plate.size

draw = ImageDraw.Draw(plate)

# 1. Clean the name banner
# The name banner is at x: 220 to 820, y: 110 to 185
banner_bg = (245, 237, 219, 255)
# Fill the rectangle
draw.rectangle([220, 115, 820, 182], fill=banner_bg)

# Find a suitable system font for the name
# Let's check available fonts in Windows/Fonts
font_paths = [
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\georgiab.ttf"
]
chosen_font = None
for p in font_paths:
    if os.path.exists(p):
        chosen_font = p
        break

font_name = ImageFont.truetype(chosen_font or "arial.ttf", 52)

name_text = "Tahseen Raza Ansari"
# Calculate text bbox
bbox = draw.textbbox((0, 0), name_text, font=font_name)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]

tx = (W - tw) // 2
ty = 118

# Draw drop shadow then main text
draw.text((tx + 2, ty + 2), name_text, font=font_name, fill=(0, 0, 0, 70))
draw.text((tx, ty), name_text, font=font_name, fill=(18, 18, 18, 255))

# Save preview of customized plate
plate.save("card/plate_tahseen.webp", "WEBP", quality=95)
print("Saved card/plate_tahseen.webp")

