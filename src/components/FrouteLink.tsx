import React, { forwardRef, Ref, ReactElement, useCallback } from "react";
import { useNavigation } from "../react-bind";
import { ParamsOfRoute, RouteDefinition } from "../RouteDefiner";

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

// const isRoutable = (href: string | undefined) => {
//   const parsed = parseUrl(href ?? "");
//   const current = parseUrl(location.href);

//   if (!href) return false;
//   if (href[0] === "#") return false;
//   if (parsed.protocol && parsed.protocol !== current.protocol) return false;
//   if (parsed.host && parsed.host !== location.host) return false;
//   return true;
// };

const isModifiedEvent = (event: React.MouseEvent) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

export const FrouteLink: FrouteLink = forwardRef(
  ({ to, params, query, ...props }, ref) => {
    const { push } = useNavigation();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (props.onClick) props.onClick(e);
        if (e.isDefaultPrevented()) return;
        if (isModifiedEvent(e)) return;

        e.preventDefault();

        push(to, params, query);
      },
      [props.onClick, to, params, query]
    );

    return <a ref={ref} {...props} onClick={handleClick} />;
  }
);
