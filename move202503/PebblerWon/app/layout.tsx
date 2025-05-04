import "app/components/global.css";
import { inter } from "./components/fonts";
import { ToastContainer } from "react-toastify";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ fontSize: 16 }}>
      <body
        className={`${inter.className} antialiased`}
        style={{
          backgroundColor: "#232626",
        }}
      >
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
