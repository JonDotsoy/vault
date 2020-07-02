export const bufferToBase64 = (bf: Buffer) =>
  bf.toString("base64").replace(/=*$/, "")
