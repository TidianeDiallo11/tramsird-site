import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 15,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: -0.5,
          }}
        >
          NL
        </div>
      </div>
    ),
    { ...size },
  );
}
