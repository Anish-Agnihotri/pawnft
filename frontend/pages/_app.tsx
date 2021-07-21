import "@styles/globals.scss";
import type { AppProps } from "next/app";
import StateProvider from "@state/index";

export default function PawnBank({ Component, pageProps }: AppProps) {
  return (
    <StateProvider>
      <Component {...pageProps} />
    </StateProvider>
  );
}
