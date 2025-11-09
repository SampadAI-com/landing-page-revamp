# Assets Directory Structure

This directory contains all static assets for the SampadAI landing page.

## Directory Structure

```
public/assets/
├── images/
│   ├── logo.png          # Main logo (currently logo_3.png, 120px height on desktop)
│   ├── logo_1.png        # Logo variant 1 (original)
│   ├── logo_2.png        # Logo variant 2 (transparent background)
│   └── logo_3.png        # Logo variant 3 (currently active)
└── icons/
    ├── fevicon.ico       # Browser favicon (ICO format) - ACTIVE
    ├── favicon-16x16.png # 16x16 PNG favicon
    └── favicon-32x32.png # 32x32 PNG favicon
```

## Usage

- **Logo**: Used in the top-left corner of the website and as Apple touch icon
- **Favicons**: Used in browser tabs, bookmarks, and PWA icons
- **All assets**: Optimized for web performance and SEO

## Logo Variants

- **logo.png**: Currently active logo (logo_3.png) - 120px height on desktop
- **logo_1.png**: Original logo design
- **logo_2.png**: Logo with transparent background
- **logo_3.png**: Current active logo with glass-like appearance

To switch logos, simply replace `logo.png` with your preferred variant and update the references in the code.

## File Formats

- **PNG**: For logos and high-quality icons with transparency
- **ICO**: For maximum browser compatibility
- **Multiple sizes**: Responsive favicon support for different displays
