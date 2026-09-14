import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HELIX RED-OPS / Cyber Engagement & Live Threat Operations',
  description: 'Authorized security assessment engagement, SIEM audit logging, user profile management, and dynamic handshake operations portal.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-[#050505] text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
