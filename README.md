# Phantom threads


## Installation

```bash
npm install --save phantom-threads
```

Required Node v6+ and running with the --harmony flag

## Usage

The file ```main.js``` contains:

```javascript
const createPhantomPool = require('phantom-threads')

const pool = createPhantomPool();
pool.use(async(instance) => {
    const page = await instance.createPage();
    const status = await page.open('https://google.com');
    console.log('Status of the page request was: ' + status);
    const content = await page.property('content');
    //We no longer need the phantom instance here, so lets just return the content and do with it what we please
    return content
}).then((content) => {
    console.log("The content of the page has: " + content.length + " characters");
}).catch((err) => {
    console.log("There was an error: " + err);
})
//Destroy the pool
pool.drain().then(() => {
    pool.clear();
});
```
```bash
node --harmony main.js
```

A more complex example where configurations are passed to the pool:

```javascript
const createPhantomPool = require('phantom-threads');

const pool = createPhantomPool({
    max: 4, min: 1, idleTimeoutMillis: 3000,
    //Arguments for the underlying phantom instances
    phantomArgs: [
        ['--ignore-ssl-errors=yes', '--load-images=no']
    ],
    //After this many uses the instance will be reset
    maxUsesPerInstance: 100
});
const mine_website_char_length = async(pool, url) => {
    return new Promise((resolve, reject) => {
        pool.use(async(instance) => {
            const page = await instance.createPage();
            const status = await page.open(url);
            console.log('Status of the page request was: ' + status);
            const content = await page.property('content');
            return content
        }).then((content) => {
            console.log("The content of the page: " + url + " ,has: " + content.length + " characters");
        }).catch((err) => {
            console.log("There was an error: " + err);
            reject(err);
        });
        resolve("finished");
    });
};
["https://google.com", "https://wikipedia.org", "https://github.com"].forEach(async(url) => {
    const result = await mine_website_char_length(pool, url).catch(console.log);
});
//Destroy the pool
pool.drain().then(() => {
    pool.clear()
});
```
## Contributing

Just clone the project and run:

```bash
    npm run test
```

This will run the tests and tell you if your changes are passing. The actual library is fully contained within ```index.js```

## Predecessor

This project is based on:
https://github.com/binded/phantom-pool

The project was no longer active and the npm version not working, I tried making a frok to simplify it greatly and make it actually work, since the fork was rejected I decided to start my own version.

The name is different in order to diferentiate it on npm.
