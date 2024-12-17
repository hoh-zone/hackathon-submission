

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

//
// function displayUpload(storage_info, media_type) {
//     var info = {};
//     if ("alreadyCertified" in storage_info) {
//         info = {
//             status: "Already certified",
//             blobId: storage_info.alreadyCertified.blobId,
//             endEpoch: storage_info.alreadyCertified.endEpoch,
//             suiRefType: "Previous Sui Certified Event",
//             suiRef: storage_info.alreadyCertified.eventOrObject.Event.txDigest,
//             suiBaseUrl: SUI_VIEW_TX_URL,
//         };
//     } else if ("newlyCreated" in storage_info) {
//         info = {
//             status: "Newly created",
//             blobId: storage_info.newlyCreated.blobObject.blobId,
//             endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
//             suiRefType: "Associated Sui Object",
//             suiRef: storage_info.newlyCreated.blobObject.id,
//             suiBaseUrl: SUI_VIEW_OBJECT_URL,
//         };
//     } else {
//         throw Error("Unhandled successful response!");
//     }
//
//     // The URL used to download and view the blob.
//     const baseAggregatorUrl = AGGREGATOR;
//     const blobUrl = `${baseAggregatorUrl}/v1/${info.blobId}`;
//
//     // The URL for viewing the event or object on chain
//     const suiUrl = `${info.suiBaseUrl}/${info.suiRef}`;
//
//     const isImage = media_type.startsWith("image");
//     // Create the HTML entry in the page for the uploaded blob.
//     //
//     // For the associated icon, we use the `<object/>` HTML element, as it allows specifying
//     // the media type. The walrus aggregator returns blobs as `application/octect-stream`,
//     // so it's necessary to specify the content type to the browser in the `object` element.
//     document.getElementById("uploaded-blobs").insertAdjacentHTML(
//         "afterBegin",
//         `<article class="row border rounded-2 shadow-sm mb-3">
//                     <object type="${isImage ? media_type : ""}" data="${isImage ? blobUrl : ""}"
//                         class="col-4 ps-0"></object>
//                     <dl class="blob-info col-8 my-2">
//                         <dt>Status</dt><dd>${info.status}</dd>
//
//                         <dt>Blob ID</dt>
//                         <dd class="text-truncate"><a href="${blobUrl}">${info.blobId}</a></dd>
//
//                         <dt>${info.suiRefType}</dt>
//                         <dd class="text-truncate">
//                             <a href="${suiUrl}" target="_blank">${info.suiRef}</a>
//                         </dd>
//                         <dt>Stored until epoch</dt><dd>${info.endEpoch}</dd>
//                     </dl>
//                 </article>`,
//     );
// }
