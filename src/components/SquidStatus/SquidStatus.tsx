import React, {useEffect, useState} from 'react';
import SquidCard from '@site/src/components/SquidStatus/squid-card';

// TODO:
const archivesUrl = 'https://saas.infra.gc.subsquid.io/api/client/registry/archives/';
function readChainData() {
    let archives = getChainData(archivesUrl);
    return archives;
}

function SquidCards() {
    const [squids, setSquids] = useState([]);

    useEffect(() => {

        // readChainData().then(chains => setSquids(chains));
    })
    console.log(squids);

    return (
        <>
            {squids.map( squid => (
                <SquidCard
                    logoUrl={squid.network.logoUrl}
                    name={squid.network.name}
                    provider={squid.provider}
                    version={squid.provider}
                >
                    Index GSChainsStatuses
                </ SquidCard>
            ))
            }
        </>
    );
}



async function getChainData(url) {
    return fetch(url)
        .then( res => {
            const reader = res.body.getReader();
            return new ReadableStream({
                start(controller) {
                    return pump();

                    function pump() {
                        return reader.read().then(({done, value}) => {
                            // When no more data needs to be consumed, close the stream
                            if (done) {
                                controller.close();
                                return;
                            }
                            // Enqueue the next data chunk into our target stream
                            controller.enqueue(value);
                            return pump();
                        });
                    }
                },
            });
        })
        .then((stream) => new Response(stream).json())
        .then(res => res.payload);
}

export default function SquidStatuses(): JSX.Element {

    return (
        <>
            <SquidCards />
        </>
    )
}

