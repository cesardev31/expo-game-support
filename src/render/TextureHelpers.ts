import type { TextureInfo } from './IRenderer';

// Uploads a texture from an ImageBitmap/HTMLImageElement (Web only)
export async function uploadTextureFromImage(
  gl: WebGLRenderingContext,
  id: string,
  image: HTMLImageElement | ImageBitmap
): Promise<TextureInfo> {
  const tex = gl.createTexture();
  if (!tex) throw new Error('Failed to create texture');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const width = 'width' in image ? (image as any).width : (image as ImageBitmap).width;
  const height = 'height' in image ? (image as any).height : (image as ImageBitmap).height;

  return { texture: tex, width, height };
}

// Placeholder for RN native. Decoding image bytes to raw RGBA is required before texImage2D with pixels.
// For production apps, use a native-assisted uploader or Expo utilities capable of decoding images to pixels.
export async function uploadTextureFromAssetNative(
  _gl: WebGLRenderingContext,
  _id: string,
  _assetUri: string
): Promise<TextureInfo> {
  throw new Error('uploadTextureFromAssetNative: not implemented. On iOS/Android, you must decode the image to raw pixels and call gl.texImage2D with the pixel buffer. Consider integrating an image decoding step in the host app.');
}
