/**
* Adds a listener to an event of event emitter and return
* a promise of its detection
*
* After on event is detected, the listener added here is
* automatically removed (thank to 'once')
*
* Whatever the arguments were used when firing an event, they are all
* being packed into an array result of the promise resolution
*/
function eventPromise (emitter, eventName) {
  return new Promise((resolve, reject) => {
    emitter.once(eventName, (...args) => resolve(args))
  })
}

module.exports = eventPromise
