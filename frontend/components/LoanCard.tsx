import type { ReactElement } from "react"; // Types
import styles from "@styles/components/LoanCard.module.scss"; // Component styles

/**
 * Loan NFT rendering component
 * @param {string} imageURL to render
 * @param {string} name NFT metadata
 * @param {string} description NFT metadata
 * @param {string} contractAddress NFT contract
 * @param {string} tokenId NFT token id
 * @param {boolean} selected toggled border
 * @param {Function} onClickHandler on card click
 * @param {Record<string, number>} loanDetails optional loan details
 * @returns {ReactElement}
 */
export default function LoanCard({
  imageURL,
  name,
  description,
  contractAddress,
  tokenId,
  selected = false,
  onClickHandler,
  loanDetails,
  ...props
}: {
  imageURL: string;
  name: string;
  description: string;
  contractAddress: string;
  tokenId: string;
  selected: boolean;
  onClickHandler: Function;
  loanDetails?: Record<string, number>;
}): ReactElement {
  return (
    <button
      // Highlight if active
      className={selected ? `${styles.card} ${styles.active}` : styles.card}
      // Pass handler
      onClick={() => onClickHandler()}
      // Pass additional params (key)
      {...props}
    >
      {/* NFT Image */}
      <div>
        <img src={imageURL} alt="NFT Image" />
      </div>

      {/* NFT details */}
      <h3>{name}</h3>
      <div>
        <p>{description}</p>
      </div>
      <span>
        {contractAddress.substr(0, 6) +
          "..." +
          contractAddress.slice(contractAddress.length - 4)}{" "}
        : {tokenId}
      </span>

      {loanDetails && loanDetails.interest ? (
        // If loan details exist, render
        <div className={styles.card__loan}>
          {/* Loan interest */}
          <div>
            <h4>Interest</h4>
            <h2>{loanDetails.interest}%</h2>
          </div>

          {/* Loan current raise standing */}
          <div>
            <h4>Raised (ETH)</h4>
            <h2>
              {loanDetails.amount.toFixed(2)} / {loanDetails.max.toFixed(2)}
            </h2>
          </div>
        </div>
      ) : null}
    </button>
  );
}
