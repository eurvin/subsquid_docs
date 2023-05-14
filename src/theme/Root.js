import React from 'react';
import { ApolloProvider } from "@apollo/client";
import client from '../../apollo-client'

const defaultClient = "https://squid.subsquid.io/gs-explorer-polkadot/graphql"
// Default implementation, that you can customize
function Root({children}) {
  return (
    <>
      <ApolloProvider client={client(defaultClient)}>

      {children}
      </ApolloProvider>
    </>
  );
}

export default Root;