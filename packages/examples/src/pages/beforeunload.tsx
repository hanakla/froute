import { FrouteLink, useBeforeRouteChange } from "@fleur/froute";
import { useEffect } from "react";
import { routes } from "../routes";

export default () => {
  useBeforeRouteChange(() => {
    // console.trace("hi");
    return confirm("Really back?");
  }, []);

  useEffect(() => {
    console.log("mouted");
    return () => console.log("unmounted");
  }, []);

  return (
    <div>
      <h1>beforeunload test</h1>
      <FrouteLink to={routes.index} params={{}}>
        Back to Home
      </FrouteLink>
    </div>
  );
};
