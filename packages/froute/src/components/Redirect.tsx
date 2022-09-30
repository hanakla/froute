import React, { ReactNode, useMemo } from "react";
import { useRouterContext } from "../react-bind";

type Props = { url: string; status?: number; children?: ReactNode };

export const Redirect = ({ url, status = 302, children }: Props) => {
  const router = useRouterContext();

  useMemo(() => {
    router.statusCode = status;
    router.redirectTo = url;
  }, []);

  return <>{children}</>;
};
