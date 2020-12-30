import { routeBy, routeOf } from "@fleur/froute";
import { OperationContext } from "@fleur/fleur";
import { UserOps } from "./domains";

export const routes = {
  index: routeOf("/").action({
    component: () => import("./pages/index"),
  }),
  userShow: routeOf("/users/:id").action({
    component: () => import("./pages/user"),
    preload: (context: OperationContext, { id }) =>
      Promise.all([context.executeOperation(UserOps.fetchUser, id)]),
  }),
  beforeUnload: routeOf("/beforeunload").action({
    component: () => import("./pages/beforeunload"),
  }),
};
