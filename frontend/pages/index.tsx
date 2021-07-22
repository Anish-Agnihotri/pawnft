import axios from "axios"; // Axios
import Link from "next/link"; // Routing
import Layout from "@components/Layout"; // Layout wrapper
import LoanCard from "@components/LoanCard"; // LoanCard component
import styles from "@styles/pages/Home.module.scss"; // Component styles
import { useRouter } from "next/dist/client/router"; // Router
import type { LoanWithMetadata } from "@utils/types"; // Types
import { ReactElement, useState, useEffect } from "react"; // React

/**
 * Home page
 * @returns {ReactElement}
 */
export default function Home(): ReactElement {
  // Navigation
  const router = useRouter();
  // Loan loading status
  const [loading, setLoading] = useState<boolean>(true);
  // Individual loans retrieved from chain
  const [loans, setLoans] = useState<LoanWithMetadata[]>([]);

  /**
   * Collect loans from chain
   */
  async function collectLoans(): Promise<void> {
    setLoading(true); // Toggle loading

    // Update data
    const { data } = await axios.get("/api/loans");
    setLoans(data);

    setLoading(false); // Toggle loading
  }

  // --> Lifecycle: collect loans on mount
  useEffect(() => {
    collectLoans();
  }, []);

  return (
    <Layout>
      <div>
        {/* Call to action header */}
        <div className={styles.home__cta}>
          <h1>NFT. Lending. Now.</h1>
          <p>
            PawnFT is a hybrid auction and lending platform for your NFTs.
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
              href="https://github.com/anish-agnihotri/pawnft"
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
            {/* Title */}
            <h2>All loans</h2>
            <p>Showing all {loans.length} loans.</p>

            {loading ? (
              // If loading, show loading state
              <div className={styles.home__feature_text}>
                <h3>Loading loans...</h3>
                <p>Please wait as we collect the loans from chain.</p>
              </div>
            ) : loans.length == 0 ? (
              // If no loans, show no loans found
              <div className={styles.home__feature_text}>
                <h3>No Loans Found</h3>
                <p>Be the first to create a loan!</p>
              </div>
            ) : (
              // If loans are found, render clickable, active loaans
              <div className={styles.home__feature_loans}>
                {loans.map((loan, i) => {
                  return (
                    <LoanCard
                      key={i}
                      name={loan.name}
                      description={loan.description}
                      contractAddress={loan.tokenAddress}
                      imageURL={loan.imageURL}
                      tokenId={loan.tokenId.toString()}
                      onClickHandler={() => router.push(`/loan/${loan.loanId}`)}
                      loanDetails={{
                        interest: loan.interestRate,
                        amount: loan.loanAmount,
                        max: loan.maxLoanAmount,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
