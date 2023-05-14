import React from 'react';
import clsx from 'clsx';
import {ApolloError, gql, useQuery} from '@apollo/client';
import {ApiPromise, WsProvider} from '@polkadot/api';
import client from '@site/apollo-client';
import {Query} from '@apollo/client/react/components';

type BgColor =
  | 'bg-role--building'
  | 'bg-role--success'
  | 'bg-role--error'
  | 'bg-role--syncing'
  | 'bg-role--info'
  | 'bg-role--notice'
  | 'bg-role--warning';

export type SquidCardProps = React.PropsWithChildren<{
  name: string;
  logoUrl: string;
  explorerUrl: string;
  statsUrl: string;
}>

const QUERY = gql`
        query Status {
          squidStatus {
            height
          }
        }
      `;

export async function getChainData() {
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

export const SquidCard = (props: SquidCardProps) => (
    <Query query={QUERY} client={client(props.explorerUrl)}>
        {({ loading, error, data }) => {
                return (
                    <div>
                    <img src={props.logoUrl ?? null}
                       className={
                           clsx(
                               'flex flex-col rounded-lg gap-2 cursor-pointer transition duration-150 ease-out p-4 quide-card',
                               {
                                   'hover:border-border-color-base--default hover:shadow-[0_0_4px_rgba(67,65,65,0.15)]': true
                               }
                           )
                       }
                    >

                    </img>
                        <div className="flex flex-col gap-2">
                            {/*<h5 className={clsx("body--m", {*/}
                            {/*  'text-fg-base--default': !props.isDisabled,*/}
                            {/*  'text-fg-base--muted': props.isDisabled*/}
                            {/*})}>{props.children}</h5>*/}
                            <p className="body--s text-fg-base--muted font-light">{props.name}</p>
                            <p>{props.name} Giant Squid blockheight: data.squidStatus.height</p>
                            <p>{props.name} Network blockheight: data.squidStatus.height</p>
                        </div>
                    </div>
                )
            }
        }
    </Query>)
export default SquidCard;

