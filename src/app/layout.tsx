import { Roboto } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import ProviderStore from "@/global/store/Provider";
import WindowDimensionsLabel from "../components/shared/WindowDimensionsLabel";
import { ViewTransitions } from "next-view-transitions";
import dotenv from "dotenv";
import PlantillaSegunRol from "@/components/shared/layouts/PlantillaSegunRol";
import NextTopLoader from "nextjs-toploader";
import { ColorHexadecimal } from "@/interfaces/Colors";
import { getRandomContrastColor } from "@/lib/helpers/colors/getRandomContrastColor";

dotenv.config();

// Configurando Fuente Roboto
const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: "SIASIS | I.E. 20935",
  description:
    "Sistema de asistencia para la institucion educativa 20935 Asunción 8, Imperial, Cañete",
  icons: "/images/svg/Logo.svg",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const interfazColor: ColorHexadecimal = "#dd3524";
  const contrastColor = getRandomContrastColor(interfazColor);

  return (
    <ViewTransitions>
      <html lang="es">
        <body
          className={`${roboto.variable} font-roboto antialiased portrait:min-h-[100dvh] landscape:min-h-screen`}
        >
          <style>
            {`
            
              :root{
                --color-interfaz: ${interfazColor};
              }

            `}
          </style>
          <NextTopLoader
            color={contrastColor}
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow={`0 0 10px ${contrastColor},0 0 5px ${contrastColor}`}
          />

          <WindowDimensionsLabel />
          <ProviderStore>
            <PlantillaSegunRol>{children}</PlantillaSegunRol>
          </ProviderStore>
        </body>
      </html>
    </ViewTransitions>
  );
}
