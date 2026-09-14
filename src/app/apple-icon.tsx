import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const fontData = await readFile(join(process.cwd(), "assets/fonts/LiberationSans-Bold.ttf"));

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2A4A7C 0%, #0E1B33 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 700,
            color: "#FFFFFF",
            fontFamily: "LiberationSans",
            lineHeight: 1,
            marginLeft: -8,
          }}
        >
          N
        </div>
        <div style={{ display: "flex", position: "absolute", top: 32, right: 24 }}>
          <svg width="62" height="62" viewBox="0 0 62 62" fill="none">
            <path d="M8 54 L54 8" stroke="#D4A64A" strokeWidth="10" strokeLinecap="round" />
            <path d="M28 8 L54 8 L54 34" stroke="#D4A64A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "LiberationSans", data: fontData, weight: 700, style: "normal" }],
    },
  );
}
