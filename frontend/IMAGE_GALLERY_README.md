# Image Gallery Script Documentation

This project includes an automated script to scan the `src/assets/images` folder and generate a JSON file with all image metadata.

## 🚀 Quick Start

### Generate Image List
```bash
npm run generate-images
```

This script will:
- Scan `src/assets/images` folder for all image files
- Generate `src/assets/image-list.json` with complete metadata
- Display statistics about the images found

### Supported Image Formats
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`
- `.svg`

## 📁 Generated JSON Structure

The generated `image-list.json` contains:

```json
{
  "metadata": {
    "generatedAt": "2025-09-26T18:53:51.984Z",
    "totalImages": 26,
    "totalSize": 36086315,
    "totalSizeFormatted": "34.41 MB",
    "directory": "src/assets/images",
    "supportedExtensions": [".jpg", ".jpeg", ".png", ...],
    "stats": {
      "byExtension": {
        ".jpg": {
          "count": 26,
          "size": 36086315,
          "sizeFormatted": "34.41 MB"
        }
      }
    }
  },
  "images": [
    {
      "filename": "image1.jpg",
      "path": "assets/images/image1.jpg",
      "size": 224198,
      "sizeFormatted": "218.94 KB",
      "extension": ".jpg",
      "lastModified": "2025-09-26T18:50:49.486Z",
      "type": "image"
    }
  ]
}
```

## 🎯 Using in Angular Components

The pics page automatically loads the generated JSON:

```typescript
// The images are loaded automatically in PicsPage
ngOnInit() {
  this.loadImages(); // Loads from assets/image-list.json
}
```

### Manual Usage
```typescript
import { HttpClient } from '@angular/common/http';

// Inject HttpClient
constructor(private http: HttpClient) {}

// Load image list
this.http.get<ImageListData>('assets/image-list.json').subscribe(data => {
  const imagePaths = data.images.map(img => img.path);
  console.log(`Loaded ${data.metadata.totalImages} images`);
});
```

## 🔧 Script Features

### Automatic Metadata Collection
- File size (bytes and human-readable)
- Last modified date
- File extension
- Complete file path for Angular assets

### Statistics Generation
- Total image count
- Total size of all images
- Breakdown by file extension
- Individual file information

### Error Handling
- Validates directory exists
- Handles file system errors gracefully
- Provides detailed console output

## 📂 File Locations

- **Script**: `scripts/generate-image-list.js`
- **Images**: `src/assets/images/`
- **Generated JSON**: `src/assets/image-list.json`
- **Component**: `src/app/pages/public/pics/`

## 🎨 Gallery Features

The pics page provides:
- **Responsive Grid Layout**: 1-4 columns based on screen size
- **Image Metadata Display**: Filename and size on hover
- **Loading States**: Spinner while loading images
- **Error Handling**: Fallback images if JSON fails to load
- **File Information**: Individual image details and statistics

## 🔄 Workflow

1. **Add Images**: Place images in `src/assets/images/`
2. **Generate List**: Run `npm run generate-images`
3. **Build App**: The JSON is automatically included in builds
4. **View Gallery**: Navigate to the pics page to see all images

## 🚨 Important Notes

- Run the script whenever you add/remove images from the assets folder
- The JSON file should be committed to version control
- Large images will increase bundle size - consider optimization
- The script only processes files with supported image extensions

## 🛠️ Customization

To modify supported file types, edit the `IMAGE_EXTENSIONS` array in `scripts/generate-image-list.js`:

```javascript
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
```