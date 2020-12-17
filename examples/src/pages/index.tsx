import React from "react";
import { buildPath, Link } from "@fleur/froute";
import { routes } from "../routes";

export default () => {
  return (
    <div>
      Here is index
      <br />
      <Link href={buildPath(routes.userShow, { id: "1" })}>Go to user</Link>
    </div>
  );
};
