/**
 * Composites a board PNG with a QR code image placed on the left side of the board, outside the board rectangle.
 * QR has white background. Returns a data URL of the composite PNG.
 */
export async function compositeBoardWithQr(
  boardDataUrl: string,
  qrDataUrl: string,
  qrSizePx: number
): Promise<string> {
  const boardImg = await loadImage(boardDataUrl);
  const qrImg = await loadImage(qrDataUrl);

  const boardW = boardImg.naturalWidth;
  const boardH = boardImg.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = qrSizePx + boardW;
  canvas.height = boardH;

  const ctx = canvas.getContext('2d')!;
  // QR on the left, aligned with the bottom of the board
  const qrY = Math.max(0, boardH - qrSizePx);
  ctx.drawImage(qrImg, 0, qrY, qrSizePx, qrSizePx);
  // Board on the right (unchanged)
  ctx.drawImage(boardImg, qrSizePx, 0, boardW, boardH);

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
