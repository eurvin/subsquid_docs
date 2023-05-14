import React from 'react';
import SquidCard from '@site/src/components/SquidStatus/squid-card';
import {ApiPromise, WsProvider} from '@polkadot/api';
import ClientOnly from '@site/src/components/ClientOnly';
import {GSChains} from '@site/src/components/SquidStatus/GSChainDetails';

function SquidCards() {

    return (
        <>
            {GSChains.map( gsChain => (
                <SquidCard
                    key={crypto.randomUUID()}
                    logoUrl={gsChain.logoUrl}
                    name={gsChain.name}
                    explorerUrl={gsChain.gsExplorerEndpoint}
                    statsUrl={gsChain.gsStatsEndpoint}
                />
            ))
            }
        </>
    );
}



export async function getChainData () {
    // Here we don't pass the (optional) provider, connecting directly to the default
    // node/port, i.e. `ws://127.0.0.1:9944`. Await for the isReady promise to ensure
    // the API has connected to the node and completed the initialisation process
    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
    const api = await ApiPromise.create({provider: wsProvider});

    // We only display a couple, then unsubscribe
    let count = 0;

    let blockHeight;

    // Subscribe to the new headers on-chain. The callback is fired when new headers
    // are found, the call itself returns a promise with a subscription that can be
    // used to unsubscribe from the newHead subscription
    await api.rpc.chain.subscribeNewHeads( (header): any =>{
        console.log(`Chain is at block: #${header.number}`);
        if (++count === 1) {
            wsProvider.disconnect();
           return header.number;
        }
    }).then( blockHeight => {

    });
}

export default function SquidStatuses(): JSX.Element {
    return (
        <>
            <ClientOnly>
                <SquidCards />
            </ClientOnly>
        </>
    )
}