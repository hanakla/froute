/* eslint-disable */

import { ComponentType } from "react";
import { match } from "path-to-regexp";
import { StateBase } from "./FrouteHistoryState";
import { parse as parseUrl } from "url";
import { parse as qsParse } from "querystring";
import { FrouteMatchResult } from "./routing";
import { DeepReadonly } from "./utils";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
export interface RouteDefinition<
  Params extends string,
  S extends StateBase,
  Q extends z.ZodType<any>
> {
  match(pathname: string): FrouteMatchResult<Params> | null;
  toPath(): string;
  createState(): S | null;
  getActor(): Actor<any> | null;
}

export type AnyRouteDefinition = RouteDefinition<any, any, any>;

export interface ActorDef<R extends RouteDefinition<any, StateBase, any>> {
  component: () =>
    | Promise<{ default: ComponentType<any> } | ComponentType<any>>
    | ComponentType<any>;
  query?: z.ZodType<any>;
  preload?: (
    context: any,
    params: ParamsOfRoute<R>,
    extra: {
      query: DeepReadonly<{ [K: string]: string | string[] | undefined }>;
      search: string;
    }
  ) => Promise<any>;
  [key: string]: any;
}

type ParamsObject<Params extends string | OptionalParam<string>> = {
  [K in Extract<Params, Extract<Params, OptionalParam<any>>>]: string;
} &
  {
    [K in OptionalParamStringToConst<
      Extract<Params, OptionalParam<string>>
    >]?: string;
  };

// prettier-ignore
export type ParamsOfRoute<T extends RouteDefinition<any, any, any>> =
  T extends RouteDefiner<infer P> ? ParamsObject<P>
  : T extends Readonly<RouteDefinition<infer P, any, any >> ? ParamsObject<P>
  : T extends RouteDefinition<infer P, any, any> ? ParamsObject<P>
  : never;

export type StateOfRoute<
  R extends RouteDefinition<any, StateBase, any>
> = R extends RouteDefinition<any, infer S, any> ? S : never;

export type QuerySchemaOfRoute<
  R extends RouteDefinition<any, any, any>
> = R extends RouteDefinition<any, any, infer Q> ? Q : never;

type OptionalParam<S extends string> = S & { __OPTIONAL: true };
type OptionalParamStringToConst<
  P extends OptionalParam<string>
> = P extends OptionalParam<infer K> ? K : never;

type ParamFragment<T extends string> = T extends `:${infer R}?`
  ? OptionalParam<R>
  : T extends `:${infer R}`
  ? R
  : never;
type ParamsInPath<S extends string> = string extends S
  ? string
  : S extends `${infer R}/${infer Rest}`
  ? ParamFragment<R> | ParamsInPath<Rest>
  : ParamFragment<S>;

/**
 * Define route by fragment chain
 * @deprecated use `routeOf` instead
 */
export const routeBy = (path: string): RouteDefiner<Exclude<"", "">> => {
  return new RouteDefiner(path);
};

/**
 * Define route by pathname
 *
 * - `routeOf('/fragment')`
 * - `routeOf('/fragment/:paramName')`
 * - `routeOf('/fragment/:paramName?')`
 */
export const routeOf = <S extends string>(
  path: S
): RouteDefiner<ParamsInPath<S>> => {
  return new RouteDefiner(path);
};

class Actor<R extends RouteDefinition<any, any, any>> implements ActorDef<R> {
  // _cache: ComponentType<any>;
  private cache: ComponentType<any> | null = null;

  constructor(
    public component: ActorDef<any>["component"],
    public preload?: ActorDef<any>["preload"],
    public query?: ActorDef<any>["query"]
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

export class RouteDefiner<
  Params extends string,
  State extends StateBase = never,
  Query extends z.ZodType<any> = any
> implements RouteDefinition<Params, State, Query> {
  private stack: string[] = [];
  private actor: Actor<this> | null = null;
  private stateFactory: (() => State) | null = null;

  constructor(path: string) {
    this.stack.push(path.replace(/^\//, ""));
  }

  public param<P extends string, Params extends string>(
    this: RouteDefiner<Params, State>,
    paramName: P
  ): RouteDefiner<Params | P, State> {
    this.stack.push(`:${paramName}`);
    return this as any;
  }

  public path(path: string): RouteDefiner<Params, State> {
    this.stack.push(path.replace(/^\//, ""));
    return this as any;
  }

  public state<S extends StateBase>(
    this: RouteDefiner<Params, S>,
    stateFactory: () => S
  ): RouteDefiner<Params, S, Query> {
    this.stateFactory = stateFactory;
    return this as any;
  }

  public action<Q extends z.ZodType<any>>({
    component,
    preload,
    ...rest
  }: ActorDef<this> & { query?: Q }): Readonly<
    RouteDefinition<Params, State, Q>
  > {
    this.actor = new Actor<this>(component, preload);
    Object.assign(this.actor, rest);
    return this as RouteDefiner<Params, State, Q>;
  }

  public match(pathname: string): FrouteMatchResult<Params> | null {
    const parsed = parseUrl(pathname);
    const result = match<Record<Params, string>>(this.toPath(), {
      decode: decodeURIComponent,
    })(parsed.pathname!);

    return result
      ? {
          ...result,
          query: qsParse(parsed.query ?? "", void 0, void 0, {
            decodeURIComponent,
          }),
          search: parsed.search ?? "",
        }
      : null;
  }

  public getActor<R extends RouteDefiner<any, any>>(this: R) {
    return this.actor;
  }

  public createState() {
    return this.stateFactory?.() ?? null;
  }

  public toPath() {
    return "/" + this.stack.join("/");
  }
}
