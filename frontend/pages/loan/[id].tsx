import dayjs from "dayjs"; // Dates
import axios from "axios"; // Requests
import { eth } from "@state/eth"; // State container
import Layout from "@components/Layout"; // Layout
import { collectSingleLoan } from "@api/loan"; // Collection
import { ReactElement, useState } from "react"; // React
import { loan as loanProvider } from "@state/loan"; // State container
import styles from "@styles/pages/Loan.module.scss"; // Component styles
import type { LoanWithMetadata } from "@utils/types"; // Types

// Zero Address constant
const ZERO_ADDRESS: string = "0x0000000000000000000000000000000000000000";

/**
 * Loan page
 * @param {LoanWithMetadata} loan to pre-populate page (SSR)
 * @returns {ReactElement}
 */
export default function Loan({
  loan: defaultLoan,
}: {
  loan: LoanWithMetadata;
}) {
  // Collect individual action functions
  const { cancelLoan, drawLoan, seizeLoan, underwriteLoan, repayLoan } =
    loanProvider.useContainer();
  // Collect authentication
  const { address, unlock }: { address: string | null; unlock: Function } =
    eth.useContainer();

  // Current page details
  const [loan, setLoan] = useState<LoanWithMetadata>(defaultLoan);
  // Enterred bid amount
  const [bid, setBid] = useState<number>(0);
  // Button loading status
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Refresh loan data by hitting back-end
   */
  async function refreshLoan(): Promise<void> {
    const { data } = await axios.get(`/api/loan?id=${loan.loanId}`);
    setLoan(data);
  }

  /**
   * Runs a provided function w/ loading and data refresh
   * @param {Function} call to encapsulate
   */
  async function runWithLoading(call: Function): Promise<void> {
    setLoading(true); // Toggle loading
    await call(); // Call function
    await refreshLoan(); // Refresh page data
    setLoading(false); // Toggle loading
  }

  return (
    <Layout>
      <div>
        {/* Loan NFT showcase */}
        <div className={styles.loan__image}>
          <img src={loan.imageURL.slice(0, -5)} alt={loan.name} />
        </div>

        <div className="sizer">
          {/* Loan NFT content */}
          <div className={styles.loan__content}>
            {/* Left: details */}
            <LoanDetails {...loan} />

            {/* Right: actions */}
            <div>
              <h2>Actions</h2>

              {address ? (
                // Ensure user is authenticated
                <>
                  {/* Underwrite loan */}
                  <div>
                    <h4>Underwrite loan</h4>
                    <p>
                      A lender can underwrite an unpaid loan (and become the top
                      bidder) so long as the loan has available capacity (is
                      under bid ceiling).
                    </p>
                    {loan.tokenOwner !== ZERO_ADDRESS &&
                    loan.loanCompleteTime >
                      Math.round(new Date().getTime() / 1000) &&
                    loan.loanAmount !== loan.maxLoanAmount ? (
                      <div>
                        <input
                          type="number"
                          value={bid}
                          onChange={(e) => setBid(e.target.value)}
                          placeholder="Bid Value (Ether)"
                          min={loan.loanAmount}
                          max={loan.maxLoanAmount}
                          step="0.000001"
                        />
                        <button
                          onClick={() =>
                            runWithLoading(() =>
                              underwriteLoan(loan.loanId, bid)
                            )
                          }
                          disabled={
                            loading ||
                            bid === 0 ||
                            bid <= loan.loanAmount ||
                            bid > loan.maxLoanAmount
                          }
                        >
                          {loading
                            ? "Loading..."
                            : bid == 0
                            ? "Bid cannot be 0"
                            : bid < loan.loanAmount
                            ? "Bid under top bid"
                            : bid > loan.maxLoanAmount
                            ? "Bid too large"
                            : "Underwrite loan"}
                        </button>
                      </div>
                    ) : (
                      <span>Loan cannot be underwritten.</span>
                    )}
                  </div>

                  {/* Draw loan */}
                  <div>
                    <h4>Draw Loan</h4>
                    <p>
                      The loan owner can draw capital as it becomes available
                      with new bids, until repayment.
                    </p>
                    <button
                      onClick={() =>
                        runWithLoading(() => drawLoan(loan.loanId))
                      }
                      disabled={
                        loading ||
                        loan.loanAmountDrawn === loan.loanAmount ||
                        address !== loan.tokenOwner
                      }
                    >
                      {loading
                        ? "Loading..."
                        : loan.loanAmountDrawn === loan.loanAmount
                        ? "No capacity to draw"
                        : address !== loan.tokenOwner
                        ? "Not owner"
                        : "Draw capital"}
                    </button>
                  </div>

                  {/* Repay loan */}
                  <div>
                    <h4>Repay loan</h4>
                    <p>
                      Anyone can repay a loan, as long as it is unpaid, not
                      expired, and has at least 1 bid.
                    </p>
                    <button
                      onClick={() =>
                        runWithLoading(() => repayLoan(loan.loanId))
                      }
                      disabled={
                        loading ||
                        loan.tokenOwner === ZERO_ADDRESS ||
                        loan.firstBidTime === 0 ||
                        loan.loanCompleteTime <=
                          Math.round(new Date().getTime() / 1000)
                      }
                    >
                      {loading
                        ? "Loading..."
                        : loan.tokenOwner === ZERO_ADDRESS
                        ? "Loan is already repaid"
                        : loan.firstBidTime === 0
                        ? "Loan has no bids to repay"
                        : loan.loanCompleteTime <=
                          Math.round(new Date().getTime() / 1000)
                        ? "Loan has expired"
                        : "Repay loan"}
                    </button>
                  </div>

                  {/* Cancel loan */}
                  <div>
                    <h4>Cancel loan</h4>
                    <p>
                      The loan owner can cancel the loan and recollect their NFT
                      until the first bid has been placed.
                    </p>
                    <button
                      onClick={() =>
                        runWithLoading(() => cancelLoan(loan.loanId))
                      }
                      disabled={
                        loading ||
                        loan.loanAmount > 0 ||
                        address !== loan.tokenOwner
                      }
                    >
                      {loading
                        ? "Loading..."
                        : loan.loanAmount > 0
                        ? "Cannot cancel with bids"
                        : address !== loan.tokenOwner
                        ? "Not owner"
                        : "Cancel loan"}
                    </button>
                  </div>

                  {/* Seize loan */}
                  <div>
                    <h4>Seize loan</h4>
                    <p>
                      Anyone can call seize loan on behalf of the lender if the
                      owner defaults on their terms.
                    </p>
                    <button
                      onClick={() =>
                        runWithLoading(() => seizeLoan(loan.loanId))
                      }
                      disabled={
                        loading ||
                        loan.tokenOwner === ZERO_ADDRESS ||
                        loan.loanCompleteTime >
                          Math.round(new Date().getTime() / 1000)
                      }
                    >
                      {loading
                        ? "Loading..."
                        : loan.tokenOwner === ZERO_ADDRESS
                        ? "Loan is already repaid"
                        : loan.loanCompleteTime >
                          Math.round(new Date().getTime() / 1000)
                        ? "Loan has not expired"
                        : "Seize loan"}
                    </button>
                  </div>
                </>
              ) : (
                // If unauthenticated, return authentication prompt
                <div>
                  <h4>Unauthenticated</h4>
                  <p>Please authenticate to take any actions.</p>
                  <button onClick={unlock}>Unlock</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/**
 * Left side: general loan and NFT details
 * @param {LoanWithMetadata} loan details
 * @returns {ReactElement}
 */
function LoanDetails(loan: LoanWithMetadata): ReactElement {
  return (
    <div>
      {/* NFT details */}
      <h2>{loan.name}</h2>
      <p>{loan.description}</p>

      {/* Loan details */}
      <h4>Loan Details</h4>
      {loan.tokenOwner === ZERO_ADDRESS ? (
        // If token owner = 0x0 force repaid status
        <span>This loan has been repaid.</span>
      ) : (
        // Else, show data
        <>
          <p>
            This NFT is currently owned and lent out by{" "}
            <a
              href={`https://rinkeby.etherscan.io/address/${loan.tokenOwner}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {loan.tokenOwner}
            </a>
            . The owner is paying {loan.interestRate}% fixed interest until{" "}
            {dayjs(loan.loanCompleteTime * 1000).format("MMMM D, YYYY h:mm A")}{" "}
            to facilitate a bid ceiling of {loan.maxLoanAmount} Ether.
          </p>
          {loan.lender !== ZERO_ADDRESS ? (
            <p>
              The current top lender is{" "}
              <a
                href={`https://rinkeby.etherscan.io/address/${loan.lender}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {loan.lender}
              </a>{" "}
              with a bid of {loan.loanAmount} Ether (of which the owner has
              drawn {loan.loanAmountDrawn} Ether).
            </p>
          ) : (
            <p>There are currently no active bids.</p>
          )}
          <p>
            This NFT is token ID {loan.tokenId} of contract{" "}
            <a
              href={`https://rinkeby.etherscan.io/address/${loan.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {loan.tokenAddress}
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}

// Run on page load
export async function getServerSideProps({
  params: { id },
}: {
  params: { id: string };
}) {
  // Collect loan
  const loan = await collectSingleLoan(Number(id));

  // Else, return retrieved loan
  return {
    // As prop
    props: {
      loan,
    },
  };
}
