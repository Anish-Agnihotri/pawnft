import Link from "next/link"; // Routing
import Layout from "@components/Layout"; // Layout wrapper
import type { ReactElement } from "react"; // Types
import styles from "@styles/pages/Home.module.scss"; // Component styles

/**
 * Home page
 * @returns {ReactElement}
 */
export default function Home(): ReactElement {
  return (
    <Layout>
      <div>
        {/* Call to action header */}
        <div className={styles.home__cta}>
          <h1>NFT. Borrowing. Now.</h1>
          <p>
            PawnBank is a hybrid auction and lending platform for your NFTs.
            Borrow against your collection or earn fixed rewards.
          </p>

          {/* CTA action buttons */}
          <div>
            {/* Direct to create page */}
            <Link href="/create">
              <a>Create loan</a>
            </Link>

            {/* Open GitHub in new tab */}
            <a
              href="https://github.com/anish-agnihotri/pawnbank"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Feature section of open loans */}
        <div className={styles.home__feature}>
          <div className="sizer">
            <h2>All loans</h2>
            <p>Showing all X loans created in the last month.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
