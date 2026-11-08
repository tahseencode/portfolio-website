import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

plate = Image.open('card/plate.webp').convert('RGBA')
W, H = plate.size

draw = ImageDraw.Draw(plate)

# ===== 1. TOP BANNER: replace "Rishi Thakor" with "Tahseen Raza Ansari" =====
for y in range(75, 136):
    t = (y - 75) / (136 - 75)
    r = int(255 * (1 - t) + 248 * t)
    g = int(252 * (1 - t) + 236 * t)
    b = int(246 * (1 - t) + 208 * t)
    draw.line([(242, y), (818, y)], fill=(r, g, b, 255))

font_name = ImageFont.truetype('C:/Windows/Fonts/ariblk.ttf', 46)
name_text = 'Tahseen Raza Ansari'
bbox = font_name.getbbox(name_text)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (W - tw) // 2
ty = 75 + (61 - th) // 2 - 2

sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(sh)
sdraw.text((tx + 2, ty + 2), name_text, font=font_name, fill=(0, 0, 0, 90))
sh = sh.filter(ImageFilter.GaussianBlur(1.6))
plate = Image.alpha_composite(plate, sh)

draw = ImageDraw.Draw(plate)
draw.text((tx, ty), name_text, font=font_name, fill=(18, 15, 14, 255))

# ===== 2. STAT LINES 3 & 4 =====
# L3 text: y 1063-1097, L4 text: y 1130-1162
# L3 numbers: x 800-928, same y range; L4 numbers similar
# Source: clean parchment tile from y=1006-1016 (gap between L2 and ornament)
parch_tile = plate.crop((155, 1007, 955, 1014))

# Overpaint only the text pixel rows for L3 (1060 to 1100)
for y_dest in range(1055, 1100):
    src_y = (y_dest - 1055) % parch_tile.size[1]
    row = parch_tile.crop((0, src_y, parch_tile.size[0], src_y + 1))
    plate.paste(row, (155, y_dest))

# Overpaint L4 text rows (1125 to 1165)
for y_dest in range(1125, 1165):
    src_y = (y_dest - 1125) % parch_tile.size[1]
    row = parch_tile.crop((0, src_y, parch_tile.size[0], src_y + 1))
    plate.paste(row, (155, y_dest))

# ===== FONTS =====
font_stat = ImageFont.truetype('C:/Windows/Fonts/ariblk.ttf', 32)
font_num  = ImageFont.truetype('C:/Windows/Fonts/ariblk.ttf', 36)

# ===== DIAMOND DOTS =====
# Copy L1 diamonds (y 893-934, x 628-795) into L3 and L4 band
diamond_sprite = plate.crop((628, 893, 795, 934))
dw, dh = diamond_sprite.size

# L3: center in 1055-1100 band → (1055+1100)/2 - dh/2 = 1077 - 20 = 1057
l3_top = 1055 + (45 - dh) // 2
l4_top = 1125 + (40 - dh) // 2

plate.paste(diamond_sprite, (628, l3_top))
plate.paste(diamond_sprite, (628, l4_top))

# ===== DRAW TEXT (shadows + main) =====
l3_text_y = l3_top + (dh - 32) // 2
l4_text_y = l4_top + (dh - 32) // 2

sh2 = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw2 = ImageDraw.Draw(sh2)
sdraw2.text((168 + 2, l3_text_y + 2), 'AI & Vision',   font=font_stat, fill=(0, 0, 0, 80))
sdraw2.text((806 + 2, l3_text_y + 2), '92',             font=font_num,  fill=(0, 0, 0, 80))
sdraw2.text((168 + 2, l4_text_y + 2), 'Systems & C++', font=font_stat, fill=(0, 0, 0, 80))
sdraw2.text((806 + 2, l4_text_y + 2), '88',             font=font_num,  fill=(0, 0, 0, 80))
sh2 = sh2.filter(ImageFilter.GaussianBlur(1.4))
plate = Image.alpha_composite(plate, sh2)

draw = ImageDraw.Draw(plate)
draw.text((168, l3_text_y), 'AI & Vision',   font=font_stat, fill=(18, 15, 14, 255))
draw.text((806, l3_text_y), '92',             font=font_num,  fill=(18, 15, 14, 255))
draw.text((168, l4_text_y), 'Systems & C++', font=font_stat, fill=(18, 15, 14, 255))
draw.text((806, l4_text_y), '88',             font=font_num,  fill=(18, 15, 14, 255))

plate.save('card/tahseen_plate.webp', 'WEBP', quality=96)
print(f'Done! Saved card/tahseen_plate.webp  l3_top={l3_top} l4_top={l4_top} l3_text={l3_text_y} l4_text={l4_text_y}')
