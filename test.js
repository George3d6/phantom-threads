const createPhantomPool = require('./index.js');
const phantom = require('phantom');

//The readme examples
const run_first = async() => {
    return new Promise((resolve, reject) => {
        console.log("Running the first readme example");
        //Simple example
        //=========================================//
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
            pool.clear()
        });
        //=========================================//
        resolve("Done");
    });
}

const run_second = async() => {
    return new Promise((resolve, reject) => {
        console.log("Running the first readme example");
        //Example with config
        //=========================================//
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
        //=========================================//
        resolve("Done");
    });
}

const benchmark_runner = () => {
    return new Promise((resolve, reject) => {
        const pool = createPhantomPool()

        /* eslint-disable no-unused-vars */
        const noPool = async(url) => {
            const instance = await phantom.create()
            const page = await instance.createPage()
            const status = await page.open(url, {operation: 'GET'})
            if (status !== 'success')
                throw new Error(status)
            const content = await page.property('content')
            // console.log(content)
            await instance.exit()
        }

        const withPool = (url) => pool.use(async(instance) => {
            const page = await instance.createPage()
            const status = await page.open(url, {operation: 'GET'})
            if (status !== 'success')
                throw new Error(status)
            const content = await page.property('content')
            // console.log(content)
        })

        const benchmark = async(iters) => {
            return new Promise(async(resolve, reject) => {
                const url = `https://google.com`
                console.log('Starting benchmark without pool')
                for (let i = 0; i < iters; i++) {
                    console.time(`noPool-${i}`)
                    await noPool(`${url}/${i}`)
                    console.timeEnd(`noPool-${i}`)
                }
                console.log('')
                console.log('Starting benchmark with pool')
                for (let i = 0; i < iters; i++) {
                    console.time(`pool-${i}`)
                    await withPool(`${url}/${i}`)
                    console.timeEnd(`pool-${i}`)
                }
                resolve("Done");
            });
        }

        benchmark(10).then(() => {
            resolve("Done");
        }).catch(console.error)
    });
}

const test_suite = async() => {
    await run_first();
    await run_second();
    await benchmark_runner();
    process.exit(0)
}

test_suite();
