const express = require('express');
const router = express.Router();
const eBayAPI = require('./eBayAPI');
const redis = require('redis');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();


// create and connect redis client to local instance.
const redisHostName = process.env.REDISCACHEHOSTNAME;
const redisCacheKey = process.env.REDISCACHEKEY;
const client = redis.createClient(6380, redisHostName, { auth_pass: redisCacheKey, tls: { servername: redisHostName } });

// Print redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err);
});

// Set up azure blobs
// Azure connectstring
const CONNECT_STR = process.env.CONNECT_STR;

// Create the BlobServiceClient object which will be used to create a container client
const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECT_STR);

// Create a unique name for the container
const containerName = 'ebayitemscontainer';

console.log('\nCreating container...');
console.log('\t', containerName);

// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient(containerName);

// Create the container
containerClient.create()
    .then(result => console.log(`Container "${containerName}" successfully created at ${result.date}`))
    .catch(err => console.log(err.details))


router.get('/full', (req, res) => {
    const query = req.query;
    const url = createUrl(query);
    console.log(url);
    console.log(query.GPS);
    if (query.GPS === '') query.GPS = false;
    eBayAPI.getItems(url, query.country)
        .then((items) => {
            res.render('search', { items: items, GPS: query.GPS });
            // res.send(items);
        })
        .catch(err => console.log(err))
});

router.post('/location', (req, res) => {
    let itemId = req.body.itemId
    const url = `https://api.ebay.com/buy/browse/v1/item/${itemId}`
    const key = `eBay - ${itemId}`
    const blockBlobClient = containerClient.getBlockBlobClient(key); // get block blob client

    client.get(key, async (err, result) => {
        if (result) {
            resultJSON = JSON.parse(result);
            res.status(200).json(resultJSON);
        } else { // key not exist in redis
            blockBlobClient.download() // try to fetch from Azure blob
                .then(AzureResponse => streamToString(AzureResponse.readableStreamBody))
                .then(data => res.send(JSON.parse(data)))
                .catch(err => {
                    // if blob not exist serve from eBay API and store in both redis cache and azure blob
                    if (err.details.errorCode === 'BlobNotFound') {
                        eBayAPI.getItem(url)
                            .then(location => {
                                // save response in Redis store
                                client.setex(key, 3600, JSON.stringify({ source: 'Redis Cache', ...location }));

                                // save response in Azure blob
                                const blobData = JSON.stringify({ source: 'Azure blob', ...location });
                                blockBlobClient.upload(blobData, blobData.length);

                                // send JSON response back to client
                                res.status(200).json({ source: 'eBay API', ...location, });
                            })
                            .catch(err => res.send(err.message))
                    }
                    else {
                        res.send(err.details.errorCode);
                    }
                });
        }
    });
})

router.post('/submit', (req, res) => {
    let query = req.body;
    const url = createUrl(query); // build eBay url and remove any whitespace in query
    const key = `eBay - ${query.query} - ${query.limit} - ${query.minPrice} - ${query.maxPrice} - ${query.category_id} - ${query.GPS}`;
    const blockBlobClient = containerClient.getBlockBlobClient(key); // get block blob client
    console.log(key);
    console.log(url);

    // try fetching results from Redis first
    client.get(key, async (err, result) => {
        if (result) {
            resultJSON = JSON.parse(result);
            res.status(200).json(resultJSON);
        } else { // key not exist in redis
            // try { // try to fetch from Azure blob
            //     // Download the blob
            //     const downloadBlockBlobResponse = await blockBlobClient.download();

            //     // Convert the response body into a string (or Buffer)
            //     const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);

            //     // convert the downloaded buffer to string
            //     const data = downloaded.toString()

            //     // send the response back in json format
            //     res.send(JSON.parse(data))
            // } catch (err) {
            //     console.log("ERRRORRRRRRR")
            //     console.log(err)
            //     // if blob not exist serve from eBay API and store in both redis cache and azure blob
            //     if (err.details.errorCode === 'BlobNotFound') {
            //         eBayAPI.getItems(url, query.country)
            //             .then(items => {
            //                 // save response in Redis store
            //                 client.setex(key, 3600, JSON.stringify({ source: 'Redis Cache', ...items }));

            //                 // save response in Azure blob
            //                 const blobData = JSON.stringify({ source: 'Azure blob', ...items });
            //                 blockBlobClient.upload(blobData, blobData.length);

            //                 // send JSON response back to client
            //                 res.status(200).json({ source: 'eBay API', ...items, });
            //             })
            //             .catch(err => res.send(err.message))
            //     }
            //     else {
            //         res.send(err.details.errorCode);
            //     }
            // }
            blockBlobClient.download() // try to fetch from Azure blob
                .then(AzureResponse => streamToString(AzureResponse.readableStreamBody))
                .then(data => res.send(JSON.parse(data)))
                .catch(err => {
                    // if blob not exist serve from eBay API and store in both redis cache and azure blob
                    if (err.details.errorCode === 'BlobNotFound') {
                        eBayAPI.getItems(url, query.country)
                            .then(items => {
                                // save response in Redis store
                                client.setex(key, 3600, JSON.stringify({ source: 'Redis Cache', ...items }));

                                // save response in Azure blob
                                const blobData = JSON.stringify({ source: 'Azure blob', ...items });
                                blockBlobClient.upload(blobData, blobData.length);

                                // send JSON response back to client
                                res.status(200).json({ source: 'eBay API', ...items, });
                            })
                            .catch(err => res.send(err.message))
                    }
                    else {
                        res.send(err.details.errorCode);
                    }
                });
        }
    });
});

function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream) {
    const chunks = [];
    for await (const chunk of readableStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

function createUrl(query) {
    ['query', 'limit', 'minPrice', 'maxPrice', 'category_id', 'GPS'].forEach(element => {
        if (query[element] === undefined) query[element] = '';
        query[element] = (query[element]).trim();
    });
    return `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query.query}&limit=${query.limit}&filter=price:[${query.minPrice}..${query.maxPrice}],priceCurrency:AUD&category_ids=${query.category_id}`;
}

module.exports = router;