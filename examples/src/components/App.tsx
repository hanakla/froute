import React from "react";
import { useRouteRender } from "@fleur/froute";

export const App = () => {
  const { PageComponent } = useRouteRender();
  return <div>{PageComponent && <PageComponent />}</div>;
};
