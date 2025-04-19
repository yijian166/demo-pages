import "./globals.css";


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
          rel="shortcut icon"
          href="/favicon.png"
          type="image/png"
        ></link>
      </head>
      <body >
        {children}
      </body>
    </html>
  );
}
