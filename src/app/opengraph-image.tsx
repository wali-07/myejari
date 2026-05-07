import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MyEjari — Virtual Office Ejari in Dubai in 30 min";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 15% 20%, #fde4d8 0%, transparent 55%), radial-gradient(circle at 85% 80%, #ffb547 0%, transparent 55%), #ffffff",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "#f15a24",
            padding: "12px 24px",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            MyEjari
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "rgba(241, 90, 36, 0.1)",
              border: "1px solid rgba(241, 90, 36, 0.2)",
              color: "#d44814",
              fontSize: "20px",
              fontWeight: 600,
              alignSelf: "flex-start",
            }}
          >
            Dubai&apos;s fastest Virtual Office Ejari
          </div>

          <div
            style={{
              fontSize: "84px",
              fontWeight: 700,
              color: "#0d131a",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            <div>Virtual Office Ejari in Dubai,</div>
            <div>
              issued in{" "}
              <span
                style={{
                  background:
                    "linear-gradient(110deg, #f15a24 0%, #ff8a5b 50%, #ffb547 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                30 min
              </span>
              .
            </div>
          </div>

          <div
            style={{
              fontSize: "26px",
              color: "#56585e",
              maxWidth: "900px",
            }}
          >
            Match with licensed business centers across Dubai. All on
            WhatsApp.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#56585e",
            fontSize: "22px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: "#f15a24",
            }}
          />
          myejari.ae
        </div>
      </div>
    ),
    { ...size }
  );
}
