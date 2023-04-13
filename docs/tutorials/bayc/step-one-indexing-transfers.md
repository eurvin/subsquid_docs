---
title: Step 1: Generating a starter
description: >-
  Scraping Transfer events with a generated squid
sidebar_position: 10
---

# Step 1: Generating a starter

In the course of this tutorial we will build a squid that gets data about [Bored Ape Yacht Club](https://boredapeyachtclub.com) NFTs, their transfers and owners from the [Ethereum blockchain](https://ethereum.org) and [IPFS](https://ipfs.tech/), stores it in a database and serves it over a GraphQL API. Here we do the first step: generate a squid that indexes just the `Transfer` events emitted by the [BAYC token contract](https://etherscan.io/address/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d) and remove the unneeded parts.

Pre-requisites: Node.js, [Subsquid CLI](/squid-cli/installation), Docker. 

## Generating a squid

Begin by retrieving the `abi` template and installing its dependencies:
```bash
sqd init bayc-squid -t abi
cd bayc-squid
npm i
```
The next step is to generate a squid with a `squid-gen` command. This tool uses a [JSON ABI](/dead) of the contract to [configure filtering](/evm-indexing/configuration) and parsing of events and function calls of interest. To run it, we need to know:
 - Which [archive](/archives) we are going to use to retrieve the filtered blockchain data. We are going to use a public Ethereum archive that goes by the alias `eth-mainnet`.
 - Contract address, in our case `0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d`.
 - The block at which the contract was deployed, `12287507`.
 - Which events and function calls we are interested in. All the information on NFTs, their owners and transfers can be extracted from the `Transfer` events data, so we'll just index that. Note the use of a short event title instead of a full signature.

An ABI file can be specified if available. If not, the tool will attempt to retrieve it from Etherscan API. Extra options are available for handling proxy contracts, using a different Etherscan-compatible API etc. See `npx squid-gen abi --help` and [reference documentation](/basics/squid-gen) of the `squid-gen` tool.

For the task at hand we will generate a squid with
```bash
npx squid-gen abi --address 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d --archive eth-mainnet --event Transfer --from 12287507
```
The generated squid can be used right away. Run
```bash
sqd up
sqd migration:apply
sqd process
```
to start the [processor](/dead). You can also start a GraphQL server by running `sqd serve` in a separate terminal and visit the [GraphiQL playground](/dead) to see what it can do.

Full squid code at this point can be found at [this commit].

## Preparing for the next step

At this point, the squid extracts the information on `Transfer` events from blockchain. However, it also does a few things that we won't be needing and that will complicate the next step. Here is how to remove them.

Begin by removing the `Block` and `Transactions` [entity declarations](/dead) from `schema.graphql`. Rename the only remaining entity, `ContractEventTransfer`, to simply `Transfer`, then remove its `eventName` and `contract` fields. The result should look like this:
```graphql title=schema.graphql
type Transfer @entity {
    id: ID!
    blockNumber: Int! @index
    blockTimestamp: DateTime! @index
    transactionHash: String! @index
    from: String! @index
    to: String! @index
    tokenId: BigInt! @index
}
```
Remove the code adding the removed entity instances at `src/processor.ts`:
```diff
 processor.run(db, async (ctx: BatchHandlerContext<Store, any>) => {
     for (let {header: block, items} of ctx.blocks) {
-        EntityBuffer.add(
-            new Block({
-                id: block.id,
-                number: block.height,
-                timestamp: new Date(block.timestamp),
-            })
-        )
-        let lastTxHash: string | undefined
         for (let item of items) {
-            if (item.transaction.hash != lastTxHash) {
-                lastTxHash = item.transaction.hash
-                EntityBuffer.add(
-                    new Transaction({
-                        id: item.transaction.id,
-                        blockNumber: block.height,
-                        blockTimestamp: new Date(block.timestamp),
-                        hash: item.transaction.hash,
-                        to: item.transaction.to,
-                        from: item.transaction.from,
-                        success: item.transaction.success,
-                    })
-                )
-            }
 
             if (item.address === contract.address) {
                 contract.parse(ctx, block, item)
             }
         }
     }
```
The `processor.run()` call should now look like this:
```typescript
processor.run(db, async (ctx: BatchHandlerContext<Store, any>) => {
    for (let {header: block, items} of ctx.blocks) {
        for (let item of items) {
            if (item.address === contract.address) {
                contract.parse(ctx, block, item)
            }
        }
    }
    for (let entities of EntityBuffer.flush()) {
        await ctx.store.insert(entities)
    }
})
```
Remove the import of the removed entities at `src/processor.ts`:
```diff
-import {Block, Transaction} from './model'
```
Next, replace all occurences of `ContractEventTransfer` with just `Transfer` at `src/mapping/contract.ts`:
```bash
sed -i -e 's/ContractEventTransfer/Transfer/g' src/mapping/contract.ts
```
Open the file, remove the `FunctionItem` type declaration and retype the `parse` function:
```diff
-type FunctionItem = TransactionItem<{transaction: {hash: true, input: true, value: true, status: true}}>
 
-export function parse(ctx: CommonHandlerContext<Store>, block: EvmBlock, item: EventItem | FunctionItem) {
+export function parse(ctx: CommonHandlerContext<Store>, block: EvmBlock, item: EventItem) {
```
Remove the code that fills the removed fields of the `Transfer` entity instances:
```diff
                 EntityBuffer.add(
                     new Transfer({
                         id: item.evmLog.id,
                         blockNumber: block.height,
                         blockTimestamp: new Date(block.timestamp),
                         transactionHash: item.transaction.hash,
-                        contract: item.address,
-                        eventName: 'Transfer',
                         from: e[0],
                         to: e[1],
                         tokenId: e[2],
                     })
                 )
```

When done, regenerate the entities code, recreate the database and regenerate the migrations:
```bash
sqd codegen
sqd down
sqd up
sqd migration:generate
```
Verify that the squid is still functional by running `sqd process` then `sqd serve` in a separate terminal. Note how the schema shown on the [GraphiQL playground](http://localhost:4350/graphql) has become much simpler compared to a freshly generate squid.

Full squid code at this point can be found at [this commit].

In the next step we will extract the information on NFTs and their owners from the `Transfer` events data. We will store the new info in the same database with proper [foreign key relations](/basics/schema-file/entity-relations), allowing us to query our GraphQL API efficiently.