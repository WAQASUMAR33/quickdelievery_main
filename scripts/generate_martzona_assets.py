import os
from PIL import Image

def generate_assets():
    source_path = r'd:\qdelievery\quick_delivey-main\driver_app\assets\images\martzona_logo.png'
    img = Image.open(source_path).convert('RGBA')
    
    # 1. Create a transparent version by converting near-offwhite (R,G,B > 240) to alpha 0
    datas = img.getdata()
    newData = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img_transparent = Image.new('RGBA', img.size)
    img_transparent.putdata(newData)
    
    # Crop to content with a nice padding
    bbox = img_transparent.getbbox()
    if bbox:
        cropped = img_transparent.crop(bbox)
    else:
        cropped = img_transparent
        
    w, h = cropped.size
    
    # Make a square icon version with white/clean background (or transparent with padding)
    max_dim = max(w, h)
    pad = int(max_dim * 0.18)
    sq_size = max_dim + 2 * pad
    
    # Transparent square icon
    square_icon = Image.new('RGBA', (sq_size, sq_size), (255, 255, 255, 0))
    offset_x = (sq_size - w) // 2
    offset_y = (sq_size - h) // 2
    square_icon.paste(cropped, (offset_x, offset_y), cropped)
    
    # Solid white/dark square icon for app launcher
    app_icon_white = Image.new('RGBA', (sq_size, sq_size), (255, 255, 255, 255))
    app_icon_white.paste(cropped, (offset_x, offset_y), cropped)

    # 2. Output targets for Next.js App (d:\qdelievery\quick_delivey-main\public)
    next_public = r'd:\qdelievery\quick_delivey-main\public'
    next_images = os.path.join(next_public, 'images')
    os.makedirs(next_images, exist_ok=True)
    
    # Favicon ICO with multiple sizes (16, 32, 48, 64)
    square_icon.resize((64, 64), Image.Resampling.LANCZOS).save(
        os.path.join(next_public, 'favicon.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    square_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(next_public, 'favicon.png'))
    square_icon.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(next_public, 'icon-192.png'))
    square_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(next_public, 'icon-512.png'))
    
    # Store logo in Next.js public
    img.save(os.path.join(next_images, 'martzona_logo.png'))
    img_transparent.save(os.path.join(next_images, 'martzona_logo_transparent.png'))
    square_icon.save(os.path.join(next_images, 'martzona_icon.png'))
    img.save(os.path.join(next_public, 'logo.png'))
    img_transparent.save(os.path.join(next_public, 'logo_transparent.png'))

    # 3. Output targets for Flutter App (driver_app)
    flutter_root = r'd:\qdelievery\quick_delivey-main\driver_app'
    flutter_assets = os.path.join(flutter_root, 'assets', 'images')
    img_transparent.save(os.path.join(flutter_assets, 'martzona_logo_transparent.png'))
    square_icon.save(os.path.join(flutter_assets, 'martzona_icon.png'))
    
    # Flutter Web
    flutter_web = os.path.join(flutter_root, 'web')
    flutter_web_icons = os.path.join(flutter_web, 'icons')
    os.makedirs(flutter_web_icons, exist_ok=True)
    
    square_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(flutter_web, 'favicon.png'))
    square_icon.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(flutter_web_icons, 'Icon-192.png'))
    square_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(flutter_web_icons, 'Icon-512.png'))
    app_icon_white.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(flutter_web_icons, 'Icon-maskable-192.png'))
    app_icon_white.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(flutter_web_icons, 'Icon-maskable-512.png'))

    # Android mipmaps
    res_dir = os.path.join(flutter_root, 'android', 'app', 'src', 'main', 'res')
    mipmap_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }
    for folder, size in mipmap_sizes.items():
        folder_path = os.path.join(res_dir, folder)
        if os.path.exists(folder_path):
            app_icon_white.resize((size, size), Image.Resampling.LANCZOS).save(
                os.path.join(folder_path, 'ic_launcher.png')
            )
            
    # Also for d:\libertyKollections\public if it exists
    liberty_public = r'd:\libertyKollections\public'
    if os.path.exists(liberty_public):
        square_icon.resize((64, 64), Image.Resampling.LANCZOS).save(
            os.path.join(liberty_public, 'favicon.ico'),
            format='ICO',
            sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
        )
        square_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(liberty_public, 'favicon.png'))
        square_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(liberty_public, 'favicon-32x32.png'))
        # JPEGs must be RGB
        sq_rgb = Image.new('RGB', (192, 192), (255, 255, 255))
        sq_resized = square_icon.resize((192, 192), Image.Resampling.LANCZOS)
        sq_rgb.paste(sq_resized, (0, 0), sq_resized)
        sq_rgb.save(os.path.join(liberty_public, 'lk-favicon.jpg'))
        
        # Logos in liberty
        img_transparent.save(os.path.join(liberty_public, 'liberty-logo-transparent.png'))
        img_transparent.save(os.path.join(liberty_public, 'liberty-logo-header.png'))
        img_rgb = img.convert('RGB')
        img_rgb.save(os.path.join(liberty_public, 'liberty-logo.jpg'))
        img_rgb.save(os.path.join(liberty_public, 'liberty-logo-clean.jpg'))
        img.save(os.path.join(liberty_public, 'martzona_logo.png'))
        img_transparent.save(os.path.join(liberty_public, 'martzona_logo_transparent.png'))
        
    print("SUCCESS: All favicons and logos generated successfully!")

if __name__ == '__main__':
    generate_assets()
