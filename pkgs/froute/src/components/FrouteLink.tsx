import React, { forwardRef, useMemo, Ref, ReactElement } from "react";
import { useUrlBuilder } from "../react-bind";
import { ParamsOfRoute, RouteDefinition } from "../RouteDefiner";
import { Link } from "./Link";

type NativeProps = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  "href"
>;

type OwnProps<R extends RouteDefinition<any, any>> = {
  ref?: Ref<HTMLAnchorElement>;
  to: R;
  params: ParamsOfRoute<R>;
  query?: { [key: string]: string | string[] };
};

type Props<R extends RouteDefinition<any, any>> = NativeProps & OwnProps<R>;

type FrouteLink = <R extends RouteDefinition<any, any>>(
  props: Props<R>
) => ReactElement | null;

export const FrouteLink: FrouteLink = forwardRef(
  ({ to, params, query, ...props }, ref) => {
    const { buildPath } = useUrlBuilder();

    const href = useMemo(
      () => buildPath(to, params, query),
      [buildPath, to, params, query]
    );

    return <Link ref={ref} {...props} href={href} />;
  }
);
