import React, { ReactNode, useMemo } from "react";
import { useRouterContext } from "../react-bind";

type Props = { status: number; children?: ReactNode };

export const ResponseCode = ({ status, children }: Props) => {
  const router = useRouterContext();

  useMemo(() => {
    router.statusCode = status;
  }, []);

  return <>{children}</>;
};
