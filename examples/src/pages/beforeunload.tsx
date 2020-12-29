import { FrouteLink } from "@fleur/froute";
import { useEffect } from "react";
import { routes } from "../routes";

export default () => {
  useEffect(() => {
    window.addEventListener("beforeunload", () => {
      return confirm("Really back?");
    });
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
