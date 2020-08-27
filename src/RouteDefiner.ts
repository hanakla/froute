import { ComponentType } from "react";
import { match, Match } from "path-to-regexp";

interface ActorDef {
  component: () => Promise<ComponentType<any>> | ComponentType<any>;
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Params is type store
export interface IRoute<Params extends string | number | symbol> {
  match(pathname: string): Match;
  toPath(): string;
}

export class RouteDefiner<
  Params extends string | number | symbol,
  Actor extends ActorDef | unknown = unknown
> implements IRoute<Params> {
  private stack: string[] = [];
  private actor: Actor;

  constructor(path: string) {
    this.stack.push(path.replace(/^\//, ""));
  }

  param<P extends string, Params extends string>(
    this: RouteDefiner<Params>,
    paramName: P
  ): RouteDefiner<Params | P> {
    this.stack.push(`:${paramName}`);
    return this;
  }

  path(path: string): RouteDefiner<Params> {
    this.stack.push(path.replace(/^\//, ""));
    return this as any;
  }

  match(pathname: string) {
    return match(this.toPath())(pathname);
  }

  action<T extends ActorDef>(actor: T): IRoute<Params> {
    this.actor = actor as any;
    return this as any;
  }

  getActor(): ActorDef | void {
    return this.actor as ActorDef | void;
  }

  toPath() {
    return "/" + this.stack.join("/");
  }
}
