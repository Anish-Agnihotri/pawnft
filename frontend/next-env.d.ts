/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

// Custom types for react-jazzicon
declare module "react-jazzicon" {
  // Import React
  import * as React from "react";

  // Jazzicon props
  type JazziconProps = {
    diameter?: number;
    paperStyles?: object;
    seed?: number;
    svgStyles?: object;
  };

  // Export Jazzicon function component w/ props
  const Jazzicon: React.FunctionComponent<JazziconProps>;
  export function jsNumberForAddress(address: string): number;
  export default Jazzicon;
}
