### 1.0.0-beta.1

- [#2](https://github.com/fleur-js/froute/pull/2) Add Next.js partially compat `useRouter` hooks
- [#2](https://github.com/fleur-js/froute/pull/2) Expose `useHistoryState` hooks
  ```ts
  const [getHistoryState, setHistoryState] = useHistoryState()
  ```
- [#2](https://github.com/fleur-js/froute/pull/2) `RouteDefinition.match` now returns `null` instead of `false` when route is unmatched
- [#2](https://github.com/fleur-js/froute/pull/2) Add `query` and `search` in result of `RouteDefinition.match`.

### 0.2.0

- [#1](https://github.com/fleur-js/froute/pull/1) Add `routeOf` route define method
  - It's follows `Template Literal Type`
    ```ts
    routeOf('/user/:userId')
      // infered params to `{ userId: string }`
    ```
- [#1](https://github.com/fleur-js/froute/pull/1) Support history.state from `useLocation().state`
  - Sorry, I forgot to expose `useHistoryState` hooks in this version... now readonly...

### 0.1.0

- First release of `@fleur/froute`!
