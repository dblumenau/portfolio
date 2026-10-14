import provenance from '../../public/media/media-provenance.json';

/** Intrinsic capture sizes reserve the image's space before it loads. */
export function imageDimensions(path: string | undefined) {
  const filename = path?.split('/').pop();
  const asset = provenance.assets.find(item => item.file === filename);
  if (asset && 'width' in asset && 'height' in asset && typeof asset.width === 'number' && typeof asset.height === 'number') {
    return { width: asset.width, height: asset.height };
  }
  return {};
}
