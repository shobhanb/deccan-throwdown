#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Scan src/assets/images/<eventShortName>/ and generate
 * src/assets/image-list-<eventShortName>.json per event.
 */

const ASSETS_DIR = path.join(__dirname, "..", "src", "assets");
const IMAGES_DIR = path.join(ASSETS_DIR, "images");

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
];

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.warn(`Could not get file size for ${filePath}:`, error.message);
    return 0;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function imageTypeForRelativePath(relativePath) {
  if (relativePath.includes("square")) {
    return "square";
  }
  if (relativePath.includes("horizontal")) {
    return "horizontal";
  }
  if (relativePath === "") {
    return "general";
  }
  return relativePath.split("/")[0];
}

/**
 * @param {string} dirPath - Absolute path under the event folder
 * @param {string} eventShortName
 * @param {string} relativePath - Path relative to the event folder
 */
function scanDirectory(dirPath, eventShortName, relativePath = "") {
  const images = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      const relativeFilePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        const subImages = scanDirectory(
          fullPath,
          eventShortName,
          relativeFilePath
        );
        images.push(...subImages);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        const fileSize = getFileSize(fullPath);
        const stats = fs.statSync(fullPath);

        images.push({
          filename: entry.name,
          path: `assets/images/${eventShortName}/${relativeFilePath}`,
          size: fileSize,
          sizeFormatted: formatFileSize(fileSize),
          extension: path.extname(entry.name).toLowerCase(),
          lastModified: stats.mtime.toISOString(),
          type: imageTypeForRelativePath(relativePath),
          folder: relativePath || "root",
          eventShortName,
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

function buildMetadata(images, eventShortName) {
  let totalSize = 0;
  images.forEach((image) => {
    totalSize += image.size;
  });

  const metadata = {
    eventShortName,
    generatedAt: new Date().toISOString(),
    totalImages: images.length,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    directory: `src/assets/images/${eventShortName}`,
    supportedExtensions: IMAGE_EXTENSIONS,
    stats: {
      byExtension: {},
      byType: {},
      byFolder: {},
    },
  };

  images.forEach((image) => {
    const ext = image.extension;
    if (!metadata.stats.byExtension[ext]) {
      metadata.stats.byExtension[ext] = { count: 0, size: 0 };
    }
    metadata.stats.byExtension[ext].count++;
    metadata.stats.byExtension[ext].size += image.size;

    const type = image.type;
    if (!metadata.stats.byType[type]) {
      metadata.stats.byType[type] = { count: 0, size: 0 };
    }
    metadata.stats.byType[type].count++;
    metadata.stats.byType[type].size += image.size;

    const folder = image.folder;
    if (!metadata.stats.byFolder[folder]) {
      metadata.stats.byFolder[folder] = { count: 0, size: 0 };
    }
    metadata.stats.byFolder[folder].count++;
    metadata.stats.byFolder[folder].size += image.size;
  });

  ["byExtension", "byType", "byFolder"].forEach((key) => {
    Object.keys(metadata.stats[key]).forEach((item) => {
      metadata.stats[key][item].sizeFormatted = formatFileSize(
        metadata.stats[key][item].size
      );
    });
  });

  return metadata;
}

function writeEventImageList(eventShortName, images) {
  images.sort((a, b) => a.filename.localeCompare(b.filename));
  const metadata = buildMetadata(images, eventShortName);
  const outputFile = path.join(ASSETS_DIR, `image-list-${eventShortName}.json`);
  const imageListData = { metadata, images };

  fs.writeFileSync(outputFile, JSON.stringify(imageListData, null, 2), "utf8");
  return { outputFile, metadata };
}

function generateImageList() {
  console.log("🖼️  Scanning event image folders...");
  console.log(`📁 Directory: ${IMAGES_DIR}`);

  try {
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Images directory does not exist: ${IMAGES_DIR}`);
      process.exit(1);
    }

    const eventDirs = fs
      .readdirSync(IMAGES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory());

    if (eventDirs.length === 0) {
      console.warn(
        "⚠️  No event folders found. Create src/assets/images/<eventShortName>/ and re-run."
      );
      process.exit(0);
    }

    let grandTotal = 0;

    eventDirs.forEach((eventDir) => {
      const eventShortName = eventDir.name;
      const eventPath = path.join(IMAGES_DIR, eventShortName);
      const images = scanDirectory(eventPath, eventShortName);
      const { outputFile, metadata } = writeEventImageList(
        eventShortName,
        images
      );
      grandTotal += images.length;

      console.log(`\n✅ ${eventShortName}`);
      console.log(`   📄 ${outputFile}`);
      console.log(`   🖼️  ${images.length} images (${metadata.totalSizeFormatted})`);
    });

    console.log(`\n🎯 Generated lists for ${eventDirs.length} event(s), ${grandTotal} images total.`);
  } catch (error) {
    console.error("❌ Error generating image list:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateImageList();
}

module.exports = { generateImageList };
