import {
  HiOutlineDocument,
  HiOutlineDocumentText,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineSpeakerWave,
  HiOutlineArchiveBox,
  HiOutlineCodeBracket,
} from 'react-icons/hi2';

/**
 * File-type visuals for the SharePoint-style workspace tables (reissued work
 * order §1). Maps a file's extension to an icon + tinted tile so every row
 * reads like SharePoint's "Type" column at a glance. Tile colors reuse the
 * design system's hue tokens (cat-* threads + error/warning/primary) — all
 * literal class strings so Tailwind keeps them in the build.
 */
const FILE_TYPES = {
  image: { icon: HiOutlinePhoto, tile: 'bg-cat-arts/10 text-cat-arts' },
  video: { icon: HiOutlineFilm, tile: 'bg-cat-systems/10 text-cat-systems' },
  audio: { icon: HiOutlineSpeakerWave, tile: 'bg-cat-web/10 text-cat-web' },
  archive: { icon: HiOutlineArchiveBox, tile: 'bg-warning-600/10 text-warning-600' },
  code: { icon: HiOutlineCodeBracket, tile: 'bg-cat-software/10 text-cat-software' },
  pdf: { icon: HiOutlineDocumentText, tile: 'bg-error-600/10 text-error-600' },
  document: { icon: HiOutlineDocument, tile: 'bg-primary-600/10 text-primary-600' },
};

const EXTENSION_GROUPS = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  code: [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb',
    'html', 'css', 'scss', 'json', 'xml', 'yml', 'yaml', 'sql', 'sh',
  ],
  pdf: ['pdf'],
};

const EXT_TO_GROUP = Object.entries(EXTENSION_GROUPS).reduce((map, [group, exts]) => {
  exts.forEach((ext) => map.set(ext, group));
  return map;
}, new Map());

/**
 * Resolve the icon + tile classes for a file row.
 * @param {string} fileName - Original file name (used to recover the extension)
 * @param {string} [fileType] - Pre-normalized extension from the API (wins if present)
 * @returns {{ icon: Component, tile: string }}
 */
export function getFileVisual(fileName, fileType) {
  const ext = String(fileType || '').split('.').pop().toLowerCase();
  const fromName = String(fileName || '').split('.').pop().toLowerCase();
  const group = EXT_TO_GROUP.get(ext) || EXT_TO_GROUP.get(fromName) || 'document';
  return FILE_TYPES[group];
}
