export const generateSvgBase64 = (
  char: string,
  fontSize: number = 32
): string => {
  const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${fontSize}" height="${fontSize}">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="${fontSize}" fill="black">
          ${char}
        </text>
      </svg>
    `.trim();

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
};
