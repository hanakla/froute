import { ComponentType } from "react";
import { match, Match } from "path-to-regexp";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Params is type store
export interface RouteDefinition<Params extends string> {
  match(pathname: string): Match;
  toPath(): string;
  getActor(): Actor<any> | null;
}

export interface ActorDef<R extends RouteDefinition<any>> {
  component: () =>
    | Promise<{ default: ComponentType<any> } | ComponentType<any>>
    | ComponentType<any>;
  preload?: (
    context: any,
    params: ParamsOfRoute<R>,
    query: { [K: string]: string | string[] | undefined }
  ) => Promise<any>;
  [key: string]: any;
}

type ParamsObject<Params extends string | OptionalParam<string>> =
  { [K in Extract<Params, Extract<Params, OptionalParam<any>>>]: string }
  & { [K in OptionalParamStringToConst<Extract<Params, OptionalParam<string>>>]?: string }

// prettier-ignore
export type ParamsOfRoute<T extends RouteDefinition<any>> =
  T extends RouteDefiner<infer P> ? ParamsObject<P>
  : T extends Readonly<RouteDefinition<infer P>> ? ParamsObject<P>
  : T extends RouteDefinition<infer P> ? ParamsObject<P>
  : never;

type OptionalParam<S extends string> = S & { __OPTIONAL: true }
type OptionalParamStringToConst<P extends OptionalParam<string>> = P extends OptionalParam<infer K> ? K : never

type ParamFragment<T extends string> = T extends `:${infer R}?` ? OptionalParam<R> : T extends `:${infer R}` ? R : never
type ParamsInPath<S extends string> = string extends S ? string
  : S extends `${infer R}/${infer Rest}` ? ParamFragment<R> | ParamsInPath<Rest>
    : ParamFragment<S>

/**
 * Define route by fragment chain
 * @deprecated use `routeOf` instead
 */
export const routeBy = (path: string): RouteDefiner<Exclude<"", "">> => {
  return new RouteDefiner(path);
};

/** Define route by pathname */
export const routeOf = <S extends string>(path: S): RouteDefiner<ParamsInPath<S>> => {
  return new RouteDefiner(path)
}

class Actor<R extends RouteDefinition<any>> implements ActorDef<R> {
  // _cache: ComponentType<any>;
  private cache: ComponentType<any> | null = null;

  constructor(
    public component: ActorDef<any>["component"],
    public preload: ActorDef<any>["preload"]
  ) {}

  public async loadComponent() {
    if (this.cache) return this.cache;

    const module = await this.component();
    this.cache = (module as any).default ?? module;
    return this.cache;
  }

  public get cachedComponent() {
    return this.cache;
  }
}

export class RouteDefiner<Params extends string>
  implements RouteDefinition<Params> {
  private stack: string[] = [];
  private actor: Actor<this> | null = null;

  constructor(path: string) {
    this.stack.push(path.replace(/^\//, ""));
  }

  public param<P extends string, Params extends string>(
    this: RouteDefiner<Params>,
    paramName: P
  ): RouteDefiner<Params | P> {
    this.stack.push(`:${paramName}`);
    return this;
  }

  public path(path: string): RouteDefiner<Params> {
    this.stack.push(path.replace(/^\//, ""));
    return this as any;
  }

  public action({
    component,
    preload,
    ...rest
  }: ActorDef<this>): Readonly<RouteDefinition<Params>> {
    this.actor = new Actor(component, preload);
    Object.assign(this.actor, rest);
    return this as any;
  }

  public match(pathname: string) {
    return match(this.toPath())(pathname);
  }

  public getActor<R extends RouteDefiner<any>>(this: R) {
    return this.actor;
  }

  public toPath() {
    return "/" + this.stack.join("/");
  }
}
