import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Build My Groundwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          backgroundColor: "#0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 60,
            height: 3,
            backgroundColor: "#C45B28",
            marginBottom: 32,
          }}
        />
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#C45B28",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Build My Groundwork
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#E8E2D8",
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 800,
          }}
        >
          Wellness for Construction Professionals
        </div>
        <div
          style={{
            fontSize: 18,
            color: "#9A9A9A",
            marginTop: 24,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Fitness. Mental Health. Leadership. One app. Ten minutes a day.
        </div>
      </div>
    ),
    { ...size }
  );
}
