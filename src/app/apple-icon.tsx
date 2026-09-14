import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2A4A7C 0%, #0E1B33 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          NL
        </div>
        <svg width="66" height="34" viewBox="0 0 66 34" fill="none" style={{ marginTop: 14 }}>
          <path
            d="M2 30 L22 12 L34 22 L64 4"
            stroke="#D4A64A"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M46 4 L64 4 L64 20" stroke="#D4A64A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
