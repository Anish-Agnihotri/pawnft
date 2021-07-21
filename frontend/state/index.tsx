import { eth } from "@state/eth"; // Eth state provider
import { loan } from "@state/loan"; // Loan functions state provider
import type { ReactElement } from "react"; // Types

/**
 * State providing wrapper
 * @param {ReactElement[]} children to inject
 * @returns {ReactElement} wrapper
 */
export default function StateProvider({
  children,
}: {
  children: ReactElement[];
}): ReactElement {
  return (
    // Wrap in eth and loan sub-providers
    <eth.Provider>
      <loan.Provider>{children}</loan.Provider>
    </eth.Provider>
  );
}
