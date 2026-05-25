import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const localeBootstrapScript = `try{var l=localStorage.getItem("locale");if(l==="en"||l==="zh"){document.documentElement.dataset.locale=l;document.documentElement.lang=l==="en"?"en":"zh-CN"}}catch(e){}`

export const metadata: Metadata = {
  title: 'fic-investly AI',
  description: 'Fidelity International AI assistant and knowledge base workspace.',
  icons: {
    icon: [{ url: '/brand/fidelity-mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/brand/fidelity-mark.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" data-locale="zh" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden overscroll-none font-sans antialiased">
        <Script id="locale-bootstrap" strategy="beforeInteractive">
          {localeBootstrapScript}
        </Script>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
