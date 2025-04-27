// backend/utils.js
// 工具：把 hex 字符串和 UTF-8 字符串各自转成 Uint8Array

/**
 * 将十六进制字符串（可带 0x 前缀）转为 Uint8Array
 * @param {string} hex
 */
export function hexToBytes(hex) {
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = hex.slice(2);
  }
  const len = hex.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * 将 UTF-8 文本转为 Uint8Array
 * @param {string} str
 */
export function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

