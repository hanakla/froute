import React from "react";
import { ResponseCode, useParams, Link, useUrlBuilder } from "@fleur/froute";
import { useStore } from "@fleur/react";
import { routes } from "../routes";
import { UserStore } from "../domains";

export default () => {
  const params = useParams(routes.userShow);
  const { buildPath } = useUrlBuilder();
  const userIds = useStore((get) => get(UserStore).state.fetchedIds);

  if (userIds.length === 0) {
    return <ResponseCode status={404}>User not found</ResponseCode>;
  }

  return (
    <div>
      Here is user page for id:{params.id}
      <br />
      Fetched user ids: {userIds.join(",")}
      <br />
      <Link href={buildPath(routes.index, {})}>Back to home</Link>
    </div>
  );
};
