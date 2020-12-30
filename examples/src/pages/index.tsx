import React from "react";
import { buildPath, Link } from "@fleur/froute";
import { routes } from "../routes";

export default () => {
  return (
    <div>
      Here is index
      <br />
      <Link href={buildPath(routes.userShow, { id: "1" })}>Go to user</Link>
      <br />
      <Link href={buildPath(routes.userShow, { id: "404" })}>
        Go to not found user
      </Link>
      <br />
      <Link href={buildPath(routes.beforeUnload, { id: "404" })}>
        Go to beforeunload check
      </Link>
    </div>
  );
};
