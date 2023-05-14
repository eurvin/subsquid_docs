import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = (uri) => new ApolloClient({
  uri: uri,
  cache: new InMemoryCache(),
});

export default client