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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2A4A7C 0%, #0E1B33 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 104,
              fontWeight: 800,
              color: "#FFFFFF",
              fontFamily: "Arial, Helvetica, sans-serif",
              lineHeight: 1,
            }}
          >
            N
          </span>
          <div style={{ display: "flex", width: 56, height: 6, borderRadius: 3, background: "#D4A64A", marginTop: 10 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
