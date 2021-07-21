import Document, { Html, Head, Main, NextScript } from "next/document"; // Document

/**
 * Exports custom document to inject Head
 */
export default class PawnBankDocument extends Document {
  render() {
    return (
      <Html>
        {/* Custom Head */}
        <Head>
          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="true"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
