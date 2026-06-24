import QRCode from "qrcode";

export async function renderQrPng(text: string): Promise<Buffer> {
  const buf = await QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 4,
    width: 512,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  return buf;
}
