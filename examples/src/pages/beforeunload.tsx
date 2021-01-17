import { FrouteLink, useBeforeRouteChange } from "@fleur/froute";
import { routes } from "../routes";

export default () => {
  useBeforeRouteChange(() => {
    return confirm("Really back?");
  });

  return (
    <div>
      <h1>beforeunload test</h1>
      <FrouteLink to={routes.index} params={{}}>
        Back to Home
      </FrouteLink>
    </div>
  );
};
