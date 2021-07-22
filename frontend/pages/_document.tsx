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
          {/* General Meta */}
          <title>PawnFT — Collateralized NFT lending</title>
          <meta name="title" content="PawnFT — Collateralized NFT lending" />
          <meta
            name="description"
            content="PawnFT is a hybrid auction and lending platform for your NFTs. Borrow against your collection or earn fixed rewards. A hack by Anish Agnihotri."
          />

          {/* Open Graph + Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://pawnft.co/" />
          <meta
            property="og:title"
            content="PawnFT — Collateralized NFT lending"
          />
          <meta
            property="og:description"
            content="PawnFT is a hybrid auction and lending platform for your NFTs. Borrow against your collection or earn fixed rewards. A hack by Anish Agnihotri."
          />
          <meta property="og:image" content="https://pawnft.co/meta.png" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://pawnft.co" />
          <meta
            property="twitter:title"
            content="PawnFT — Collateralized NFT lending"
          />
          <meta
            property="twitter:description"
            content="PawnFT is a hybrid auction and lending platform for your NFTs. Borrow against your collection or earn fixed rewards. A hack by Anish Agnihotri."
          />
          <meta property="twitter:image" content="https://pawnft.co/meta.png" />

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

          {/* Favicon */}
          <link rel="shortcut icon" href="/static/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
