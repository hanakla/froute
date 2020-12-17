import React from "react";
import { useRouteRender, ResponseCode } from "@fleur/froute";
import {} from "../../../src";

export const App = () => {
  const { PageComponent } = useRouteRender();
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
