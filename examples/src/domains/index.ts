import Fleur, { action, actions, operations, reducerStore } from "@fleur/fleur";

export const UserOps = operations({
  fetchUser(context, id: string) {
    if (id === "404") return;

    context.dispatch(UserActions.usersFetched, [id]);
  },
});

const UserActions = actions("User", {
  usersFetched: action<string[]>(),
});

export const UserStore = reducerStore("User", () => ({
  fetchedIds: [] as string[],
})).listen(UserActions.usersFetched, (draft, fetchedIds) => {
  draft.fetchedIds = fetchedIds;
});

export const fleurApp = new Fleur({
  stores: [UserStore],
});
