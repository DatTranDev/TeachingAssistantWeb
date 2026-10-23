export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 5;

export function validateUpload(files: File[], images = false): void {
  const maxBytes = images ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (
    !files.length ||
    files.length > (images ? MAX_IMAGE_COUNT : 1) ||
    files.some((file) => file.size > maxBytes)
  ) {
    throw new Error(
      images
        ? 'Images must be up to 10 MiB each, with at most 5 images.'
        : 'Files must be up to 25 MiB.'
    );
  }
}
