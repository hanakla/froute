import { routeBy } from "@fleur/froute";
import { OperationContext } from "@fleur/fleur";
import { UserOps } from "./domains";

export const routes = {
  index: routeBy("/").action({
    component: () => import("./pages/index"),
  }),
  userShow: routeBy("/users")
    .param("id")
    .action({
      component: () => import("./pages/user"),
      preload: (context: OperationContext, { id }) =>
        Promise.all([context.executeOperation(UserOps.fetchUser, id)]),
    }),
};
