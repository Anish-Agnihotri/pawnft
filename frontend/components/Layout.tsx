import Link from "next/link";
import styles from "@styles/components/Layout.module.scss";
import { eth } from "@state/eth";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";

export default function Layout({ children }) {
  return (
    <div>
      <Header />

      <div className={styles.layout__content}>{children}</div>

      <Footer />
    </div>
  );
}

function Header() {
  const { address, unlock } = eth.useContainer();

  return (
    <div className={styles.layout__header}>
      <div className={styles.layout__header_logo}>
        <Link href="/">
          <a>
            <span>Logo</span>
          </a>
        </Link>
      </div>
      <div className={styles.layout__header_actions}>
        <Link href="/create">
          <a>Create loan</a>
        </Link>
        <button onClick={unlock}>
          {address ? (
            <>
              <span>
                {address.startsWith("0x")
                  ? // If ETH address, render truncated address
                    address.substr(0, 6) +
                    "..." +
                    address.slice(address.length - 4)
                  : // Else, render ENS name
                    address}
              </span>
              {/* Render avatar */}
              <Jazzicon diameter={16} seed={jsNumberForAddress(address)} />
            </>
          ) : (
            "Unlock"
          )}
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className={styles.layout__footer}>
      <span>
        Inspired by{" "}
        <a
          href="https://twitter.com/MarkBeylin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mark
        </a>
        . Developed by{" "}
        <a
          href="https://twitter.com/_anishagnihotri"
          target="_blank"
          rel="noopener noreferrer"
        >
          Anish
        </a>
        .
      </span>
    </div>
  );
}
