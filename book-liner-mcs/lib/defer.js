module.exports = defer

/**
* Returns a defered object -
* a promise object with resolve and reject methods
*/
function defer () {
  let _resolve
  let _reject

  const p = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })

  p.resolve = _resolve
  p.reject = _reject

  return p
}
