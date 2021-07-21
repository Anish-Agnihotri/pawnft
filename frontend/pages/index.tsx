import Layout from "@components/Layout";
import styles from "@styles/pages/Home.module.scss";
import Link from "next/link";

export default function Home() {
  return (
    <Layout>
      <div>
        <div className={styles.home__cta}>
          <h1>NFT. Borrowing. Now.</h1>
          <p>
            PawnBank is a hybrid auction and lending platform for your NFTs.
            Borrow against your collection or earn fixed rewards.
          </p>
          <div>
            <Link href="/create">
              <a>Create loan</a>
            </Link>
            <a
              href="https://github.com/anish-agnihotri/pawnbank"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
