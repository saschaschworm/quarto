import "@/assets/globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { type PropsWithChildren } from "react";

import { SOKETI } from "@/config/env";
import { PusherProvider } from "@/providers/pusher";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const RootLayout = async ({ children }: PropsWithChildren) => {
  return (
    <html lang={await getLocale()} className={`${sans.variable} ${mono.variable} h-full font-sans antialiased`}>
      <body className="h-full bg-gray-100">
        <NextIntlClientProvider messages={await getMessages()}>
          <PusherProvider host={SOKETI.ADDRESS.EXTERNAL} appKey={SOKETI.APP_KEY}>
            {children}
          </PusherProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export const metadata: Metadata = { title: "Audience Response System" };
export default RootLayout;
