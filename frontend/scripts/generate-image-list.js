#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Script to generate a JSON file containing all image filenames from src/assets/images
 */

// Configuration
const IMAGES_DIR = path.join(__dirname, "..", "src", "assets", "images");
const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "src",
  "assets",
  "image-list.json"
);

// Supported image file extensions
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
];

/**
 * Check if a file is an image based on its extension
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if the file is an image
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {number} - File size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.warn(`Could not get file size for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Recursively scan a directory for images
 * @param {string} dirPath - Directory to scan
 * @param {string} relativePath - Relative path from images root
 * @returns {Array} - Array of image objects
 */
function scanDirectory(dirPath, relativePath = "") {
  const images = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      const relativeFilePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        // Recursively scan subdirectory
        const subImages = scanDirectory(fullPath, relativeFilePath);
        images.push(...subImages);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        // Process image file
        const fileSize = getFileSize(fullPath);
        const stats = fs.statSync(fullPath);

        // Determine type based on subfolder
        let imageType = "unknown";
        if (relativePath.includes("square")) {
          imageType = "square";
        } else if (relativePath.includes("horizontal")) {
          imageType = "horizontal";
        } else if (relativePath === "") {
          // Files in root images directory
          imageType = "general";
        } else {
          // Use folder name as type
          imageType = relativePath.split("/")[0];
        }

        images.push({
          filename: entry.name,
          path: `assets/images/${relativeFilePath}`,
          size: fileSize,
          sizeFormatted: formatFileSize(fileSize),
          extension: path.extname(entry.name).toLowerCase(),
          lastModified: stats.mtime.toISOString(),
          type: imageType,
          folder: relativePath || "root",
        });
      }
    });
  } catch (error) {
    console.warn(
      `Warning: Could not read directory ${dirPath}: ${error.message}`
    );
  }

  return images;
}

/**
 * Scan the images directory and generate the image list
 */
function generateImageList() {
  console.log("🖼️  Scanning images directory and subfolders...");
  console.log(`📁 Directory: ${IMAGES_DIR}`);

  try {
    // Check if the images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory does not exist: ${IMAGES_DIR}`);
      process.exit(1);
    }

    // Recursively scan all directories and subdirectories
    const images = scanDirectory(IMAGES_DIR);
    let totalSize = 0;

    // Calculate total size
    images.forEach((image) => {
      totalSize += image.size;
    });

    // Sort images by filename for consistent ordering
    images.sort((a, b) => a.filename.localeCompare(b.filename));

    // Generate metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalImages: images.length,
      totalSize: totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      directory: "src/assets/images",
      supportedExtensions: IMAGE_EXTENSIONS,
      stats: {
        byExtension: {},
        byType: {},
        byFolder: {},
      },
    };

    // Calculate stats by extension, type, and folder
    images.forEach((image) => {
      // By extension
      const ext = image.extension;
      if (!metadata.stats.byExtension[ext]) {
        metadata.stats.byExtension[ext] = { count: 0, size: 0 };
      }
      metadata.stats.byExtension[ext].count++;
      metadata.stats.byExtension[ext].size += image.size;

      // By type
      const type = image.type;
      if (!metadata.stats.byType[type]) {
        metadata.stats.byType[type] = { count: 0, size: 0 };
      }
      metadata.stats.byType[type].count++;
      metadata.stats.byType[type].size += image.size;

      // By folder
      const folder = image.folder;
      if (!metadata.stats.byFolder[folder]) {
        metadata.stats.byFolder[folder] = { count: 0, size: 0 };
      }
      metadata.stats.byFolder[folder].count++;
      metadata.stats.byFolder[folder].size += image.size;
    });

    // Format all stats
    Object.keys(metadata.stats.byExtension).forEach((ext) => {
      metadata.stats.byExtension[ext].sizeFormatted = formatFileSize(
        metadata.stats.byExtension[ext].size
      );
    });

    Object.keys(metadata.stats.byType).forEach((type) => {
      metadata.stats.byType[type].sizeFormatted = formatFileSize(
        metadata.stats.byType[type].size
      );
    });

    Object.keys(metadata.stats.byFolder).forEach((folder) => {
      metadata.stats.byFolder[folder].sizeFormatted = formatFileSize(
        metadata.stats.byFolder[folder].size
      );
    });

    // Create the final JSON structure
    const imageListData = {
      metadata,
      images,
    };

    // Write the JSON file
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(imageListData, null, 2),
      "utf8"
    );

    // Success message
    console.log("✅ Image list generated successfully!");
    console.log(`📄 Output file: ${OUTPUT_FILE}`);
    console.log(`🖼️  Total images: ${images.length}`);
    console.log(`📦 Total size: ${formatFileSize(totalSize)}`);

    // Show breakdown by extension
    console.log("\n📊 Breakdown by extension:");
    Object.entries(metadata.stats.byExtension).forEach(([ext, stats]) => {
      console.log(`   ${ext}: ${stats.count} files (${stats.sizeFormatted})`);
    });

    // Show breakdown by type
    console.log("\n🎨 Breakdown by type:");
    Object.entries(metadata.stats.byType).forEach(([type, stats]) => {
      console.log(`   ${type}: ${stats.count} files (${stats.sizeFormatted})`);
    });

    // Show breakdown by folder
    console.log("\n📂 Breakdown by folder:");
    Object.entries(metadata.stats.byFolder).forEach(([folder, stats]) => {
      console.log(
        `   ${folder}: ${stats.count} files (${stats.sizeFormatted})`
      );
    });

    console.log(`\n🎯 You can now import the image list in your Angular app:`);
    console.log(`   import imageList from '../assets/image-list.json';`);
    console.log(`   const images = imageList.images.map(img => img.path);`);
    console.log(
      `   const squareImages = imageList.images.filter(img => img.type === 'square');`
    );
    console.log(
      `   const horizontalImages = imageList.images.filter(img => img.type === 'horizontal');`
    );
  } catch (error) {
    console.error("❌ Error generating image list:", error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateImageList();
}

module.exports = { generateImageList };
