### 1.0.0-dev.*

#### Breaking changes
-  [#4](https://github.com/fleur-js/froute/pull/4) Accept parsed query and string search in your `action.preload`.
  ```ts
  // Before
  routeOf(...).action({
    preload: (context, params, query)
  })

  // After
  routeOf(...).action({
    preload: (context, params, /* Changed ⇢ */ { query, search })
  })
  ```
-  [#2](https://github.com/fleur-js/froute/pull/2) `RouteDefinition.match` now returns `null` instead of `false` when route is unmatched

#### New features

- [#2](https://github.com/fleur-js/froute/pull/2) Add Next.js partially compat `useRouter` hooks
- [#3](https://github.com/fleur-js/froute/pull/3) Add `useFrouteRouter` hooks, it's superset of `useRouter`
- [#1](https://github.com/fleur-js/froute/pull/1) Add `useBeforeRouteChange` hooks for preventing navigation
- [#2](https://github.com/fleur-js/froute/pull/2) Add `query` and `search` in result of `RouteDefinition.match`.
- [#7](https://github.com/fleur-js/froute/pull/7) Accept plain string in 3rd argument of `buildPath`
  ```ts
  buildPath(routeDef, { param: '' }, '**Accept string here** without `?` prefix')
  ```


#### Deprecation

- The following hooks have been deprecated
  Use `useFrouteRouter` or `useRouter` instead.
  - useLocation
  - useNavigation
  - useParams
  - useUrlBuilder

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
