import { useParams } from "../../src/react-bind";
import { routeOf } from "../../src/RouteDefiner";

export const complexRoutes = {
  usersShow: routeOf("/users/:id").action({
    component: () => {
      const Component = () => {
        const params = useParams(complexRoutes.usersShow);
        return <div>I am user {params.id}</div>;
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(Component), 100)
      );
    },
  }),
  userArtworks: routeOf("/users/:id/artworks/:artworkId").action({
    component: () => {
      return () => {
        const params = useParams();
        return (
          <div>
            Here is Artwork {params.artworkId} for user {params.id}
          </div>
        );
      };
    },
  }),
};
