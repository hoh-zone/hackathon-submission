

// const AGGREGATOR="https://aggregator.walrus-testnet.walrus.space"
const PUBLISHER="https://publisher.walrus-testnet.walrus.space"


// const SUI_NETWORK = "testnet";
// const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
// const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;

export function storeBlob(fileobj) {
    const numEpochs = 1;
    const basePublisherUrl = PUBLISHER;
    const url = basePublisherUrl+`/v1/store?epochs=`+numEpochs;

    // Submit a PUT request with the file's content as the body to the /v1/store endpoint.
    return fetch(url, {
        method: "PUT",
        body: fileobj,
    }).then((response) => {
        if (response.status === 200) {
            // Parse successful responses as JSON, and return it along with the
            // mime type from the the file input element.
            return response.json().then((info) => {
                console.log(info);
                return { info: info, media_type: fileobj.type };
            });
        } else {
            throw new Error("Something went wrong when storing the blob!");
        }
    });
}
