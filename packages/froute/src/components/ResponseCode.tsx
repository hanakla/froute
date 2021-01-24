import React, { useMemo } from "react";
import { useRouterContext } from "../react-bind";

export const ResponseCode: React.FC<{ status: number }> = ({
  status,
  children,
}) => {
  const router = useRouterContext();

  useMemo(() => {
    router.statusCode = status;
  }, []);

  return <>{children}</>;
};
