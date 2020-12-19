import { parse as parseUrl } from "url";
import React, { forwardRef, useCallback, MouseEvent } from "react";
import { useNavigation } from "../react-bind";

const isRoutable = (href: string | undefined) => {
  const parsed = parseUrl(href ?? "");
  const current = parseUrl(location.href);

  if (!href) return false;
  if (href[0] === "#") return false;
  if (parsed.protocol && parsed.protocol !== current.protocol) return false;
  if (parsed.host && parsed.host !== location.host) return false;
  return true;
};

const isModifiedEvent = (event: MouseEvent) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

export const Link = forwardRef<
  HTMLAnchorElement,
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
>((props, ref) => {
  const { push } = useNavigation();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) props.onClick(e);
      if (e.isDefaultPrevented()) return;
      if (!props.href) return;
      if (isModifiedEvent(e)) return;
      if (!isRoutable(props.href)) return;

      e.preventDefault();

      const parsed = parseUrl(props.href);

      push(
        (parsed.pathname || "") + (parsed.query || "") + (parsed.hash || "")
      );
    },
    [props.onClick, props.href]
  );

  return <a ref={ref} {...props} onClick={handleClick} />;
});
