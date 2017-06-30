const phantom = require('phantom')
const genericPool = require('generic-pool')

const createPhantomPool = ({
    max = 4,
    min = 1,
    idleTimeoutMillis = 3000,
    phantomArgs = [],
    testOnBorrow = true,
    maxUsesPerInstance = 50,
    validator = () => Promise.resolve(true),
    ...otherPoolConfigs
} = {
    max: 4,
    min: 1,
    idleTimeoutMillis: 3000,
    phantomArgs: [],
    testOnBorrow: true,
    maxUsesPerInstance: 50
}) => {

    const factory = {
        create: () => phantom.create(...phantomArgs).then((instance) => {
            instance.useCount = 0;
            return instance
        }),
        destroy: (instance) => {
            instance.exit();
        },
        validate: (instance) => validator(instance)
            .then((valid) => Promise.resolve(valid && (maxUsesPerInstance <= 0 || instance.useCount < maxUsesPerInstance)))
    }

    const config = {
        max,
        min,
        idleTimeoutMillis,
        testOnBorrow,
        ...otherPoolConfigs
    }

    const pool = genericPool.createPool(factory, config)

    //Would love to be able to simply return the instance and have it automatically released when garbage collection kicks in
    //Is this possible in any way ? Am I missing a way to implement this wihtout forcing the user to use a callback
    pool.use = (fn) => {
        let resource
        return pool.acquire().then(r => {
            resource = r
            return resource
        }).then(fn).then((result) => {
            //Get the instance back in the pool
            pool.release(resource)
            return result
        }, (err) => {
            //Could be release, but since the error might be due to the instance its better to destroy it
            pool.destroy(resource)
            throw err
        })
    }
    return pool;
}

module.exports = createPhantomPool;
