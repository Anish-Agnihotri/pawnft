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
  ...props
}: {
  imageURL: string;
  name: string;
  description: string;
  contractAddress: string;
  tokenId: string;
  selected: boolean;
  onClickHandler: Function;
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
      <img src={imageURL} alt="NFT Image" />

      {/* NFt details */}
      <h3>{name}</h3>
      <div>
        <p>{description}</p>
      </div>
      <span>
        {contractAddress.substr(0, 6) +
          "..." +
          contractAddress.slice(contractAddress - 4)}{" "}
        : {tokenId}
      </span>
    </button>
  );
}
