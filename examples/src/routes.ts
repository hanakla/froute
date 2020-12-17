import { routeBy } from "@fleur/froute";

export const routes = {
  index: routeBy("/").action({
    component: () => import("./pages/index"),
  }),
  userShow: routeBy("/users")
    .param("id")
    .action({
      component: () => import("./pages/user"),
    }),
};
