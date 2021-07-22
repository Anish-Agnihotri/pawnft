declare module "react-jazzicon" {
  import * as React from "react";

  type JazziconProps = {
    diameter?: number;
    paperStyles?: object;
    seed?: number;
    svgStyles?: object;
  };

  const Jazzicon: React.FunctionComponent<JazziconProps>;

  export function jsNumberForAddress(address: string): number;

  export default Jazzicon;
}
