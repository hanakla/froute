import React from "react";
import { buildPath, Link } from "@fleur/froute";
import { routes } from "../routes";
import { useParams } from "@fleur/froute";

export default () => {
  const params = useParams(routes.userShow);

  return (
    <div>
      Here is user page for id:{params.id}
      <br />
      <Link href={buildPath(routes.index, {})}>Back to home</Link>
    </div>
  );
};
