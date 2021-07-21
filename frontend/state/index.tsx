import { eth } from "@state/eth";

export default function StateProvider({ children }) {
  return <eth.Provider>{children}</eth.Provider>;
}
