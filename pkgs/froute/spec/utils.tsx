import React, { ReactNode } from "react";
import { FrouteContext } from "../src/react-bind";
import { RouterContext } from "../src/RouterContext";

export const createComponentWrapper = (
  router: RouterContext
): React.FC<{ children: ReactNode }> => {
  return ({ children }) => (
    <FrouteContext router={router}>{children}</FrouteContext>
  );
};

export const waitTick = (ms?: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
