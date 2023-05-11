import React from "react";
import { useRouteComponent, ResponseCode } from "@fleur/froute";
import {} from "../../../src";

export const App = () => {
  const { PageComponent } = useRouteComponent();
  return (
    <div>
      {PageComponent ? (
        <PageComponent />
      ) : (
        <ResponseCode status={404}>404 Not Found</ResponseCode>
      )}
    </div>
  );
};
