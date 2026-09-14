import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const fontData = await readFile(join(process.cwd(), "assets/fonts/LiberationSans-Bold.ttf"));

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 23,
            fontWeight: 700,
            color: "#FFFFFF",
            fontFamily: "LiberationSans",
            lineHeight: 1,
            marginLeft: -1,
          }}
        >
          N
        </div>
        <div style={{ display: "flex", position: "absolute", top: 5, right: 4 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 10.5 L10.5 1.5" stroke="#D4A64A" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M5.5 1.5 L10.5 1.5 L10.5 6.5" stroke="#D4A64A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
