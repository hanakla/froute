import { ComponentType } from "react";
import { match, Match } from "path-to-regexp";

export interface ActorDef<R extends IRoute<any>> {
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Params is type store
export interface IRoute<Params extends string> {
  match(pathname: string): Match;
  toPath(): string;
  getActor(): Actor<any> | null;
}

export type ParamsOfRoute<T extends IRoute<any>> = T extends IRoute<infer P>
  ? { [K in P]: string }
  : never;

class Actor<R extends IRoute<any>> implements ActorDef<R> {
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

export const routeBy = (path: string): RouteDefiner<Exclude<"", "">> => {
  return new RouteDefiner(path);
};

// type ParamFragment<T extends string> = T extends `:${infer R}` ? R : never
// type ParamsInPath<S extends string> = string extends S ? string
//   : S extends `${infer R}/${infer Rest}`  ? ParamFragment<R> | ParamsInPath<Rest>
//     : ParamFragment<S>

// interface Route {
//   <S extends string>(path: S): RouteDefiner<ParamInPath<S>>
//   (path: string)
// }

export class RouteDefiner<Params extends string> implements IRoute<Params> {
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

  public action<T extends ActorDef<any>>({
    component,
    preload,
    ...rest
  }: T): Readonly<IRoute<Params>> {
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
