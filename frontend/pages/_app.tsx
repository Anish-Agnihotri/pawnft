// Styles
import "@styles/globals.scss";
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";

// Imports
import type { AppProps } from "next/app";
import StateProvider from "@state/index";
import { ToastContainer } from "react-toastify";

// Export application
export default function PawnBank({ Component, pageProps }: AppProps) {
  return (
    // Wrap in global state provider
    <StateProvider>
      {/* Toast container at top for notifications */}
      <ToastContainer />
      <Component {...pageProps} />
    </StateProvider>
  );
}
