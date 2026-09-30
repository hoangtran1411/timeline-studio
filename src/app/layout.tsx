import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://timeline-studio.vercel.app';

export const viewport: Viewport = {
  themeColor: "#101114",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Timeline Studio — Multi-Track Chrono Planner & Visualizer",
    template: "%s | Timeline Studio"
  },
  description: "Monochrome, high-precision multi-track timeline comparison, branch visualization, dependency mapping, and interactive historical chronology planner with SQLite.",
  keywords: [
    "timeline planner",
    "multi-track timeline",
    "chronology visualizer",
    "project roadmap",
    "interactive timeline",
    "dependency visualizer",
    "chrono studio",
    "milestone tracker",
    "gantt alternative",
    "history timeline",
    "branching timeline"
  ],
  authors: [{ name: "Timeline Studio" }],
  creator: "Timeline Studio",
  publisher: "Timeline Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Timeline Studio — Multi-Track Chrono Planner & Visualizer",
    description: "Monochrome, high-precision multi-track timeline comparison, branch visualization, and interactive historical chronology planner.",
    url: siteUrl,
    siteName: "Timeline Studio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Timeline Studio — Multi-Track Chrono Planner"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Timeline Studio — Multi-Track Chrono Planner & Visualizer",
    description: "Monochrome, high-precision multi-track timeline comparison, branch visualization, and interactive historical chronology planner.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico"
  },
  manifest: "/manifest.webmanifest",
  category: "productivity"
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "Timeline Studio",
      url: siteUrl,
      description: "Monochrome, high-precision multi-track timeline comparison, branch visualization, dependency mapping, and interactive historical chronology planner.",
      applicationCategory: "ProjectManagementApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires modern HTML5 browser.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },
      featureList: [
        "Multi-track horizontal chronology canvas",
        "Visual branch point curves and dependency lines",
        "Milestone collision avoidance lanes",
        "Cross-timeline comparative matrix spreadsheet",
        "Real-time SQLite database persistence"
      ]
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Timeline Studio",
      url: siteUrl
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#101114] text-[#ececf0]">
        {children}
      </body>
    </html>
  );
}
