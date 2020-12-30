import React, { useMemo } from "react";
import { useRouterContext } from "../react-bind";

export const Redirect: React.FC<{ url: string; status?: number }> = ({
  url,
  status = 302,
  children,
}) => {
  const router = useRouterContext();

  useMemo(() => {
    router.statusCode = status;
    router.redirectTo = url;
  }, []);

  return <>{children}</>;
};
