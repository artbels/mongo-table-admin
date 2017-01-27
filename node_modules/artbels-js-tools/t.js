;(function () {
  var T = this.T = {}

  T.iter = function (arr, func, params) {
    if (!arr || !arr.length) return console.warn('empty arr')

    var startTime = new Date()

    params = params || {}

    if (typeof params == 'function') {
      params = {
        cb: params
      }
    }

    params.cb = params.cb || console.log
    params.index = params.index || params.i || 0
    params.len = params.len || arr.length
    params.timeout = params.timeout || 0
    params.concurrency = params.concurrency || 1
    params.consoleRound = params.consoleRound || Math.floor(params.len / 20)
    if ((typeof params.verbose == 'undefined') && (arr.length > 1000)) params.verbose = true

    var finalArr = []

    var received = 0

    params.concurrency = Math.min(params.len, params.concurrency)

    for (; params.index < params.concurrency; params.index++) {
      launchNextLine(params.index)
    }

    function launchNextLine (index) {
      if (params.verbose) {
        if ((index == 1) || ((index !== 0) && (index % params.consoleRound === 0))) logStatusMessage()
      }

      var item = arr[index]
      func(item, function (res) {
        setTimeout(function () { // without timeout sync functions won't grow index
          midCallback(res, index)
        }, params.timeout)
      }, params)
    }

    function midCallback (res, index) {
      if (res) finalArr[index] = res
      received++

      if (received == params.len) {
        params.cb(finalArr)
      } else if (params.index < params.len) {
        launchNextLine(params.index)
        params.index++
      }
    }

    function logStatusMessage () {
      var currTime = new Date()
      var timeDiff = (currTime - startTime) / 1000
      var percCompl = params.index / params.len

      console.log((percCompl * 100).toFixed(0) + '% completed, ' + (timeDiff / percCompl - timeDiff).toFixed(0) + ' seconds to finish')
    }
  }

  T.live = function () {
    var servUrl = 'http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'
    T.importJs(servUrl)
  }

  T.setPageTitle = function () {
    var pagePath = window.location.pathname
    var pageTitle = document.querySelector('title')
    if (pageTitle && pagePath) pageTitle.innerHTML = pagePath.split('/').pop()
  }

  T.getLS = function (prop, message, placeholder) {
    var data
    message = message || 'Enter data for ' + prop
    placeholder = placeholder || ''
    if (!localStorage[prop] || (localStorage[prop].length === 0)) {
      data = prompt(message, placeholder)
      localStorage[prop] = data
    } else data = localStorage[prop]
    return data
  }

  T.addHit = function (key, obj) {
    if (obj[key] === undefined) obj[key] = 1
    else obj[key]++
  }

  if (typeof module !== 'undefined' && module.exports) {
    T.rp = require('request-promise')
  } else T.rp = function (params) {
      if (typeof params == 'string') params = {
          url: params
      }

      if (!params.url && !params.uri) throw Error('no url')

      params.url = params.url || params.uri
      params.method = params.method || 'GET'
      params.timeout = params.timeout || 0
      params.json = params.json || true

      return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest()
        req.open(params.method, params.url)

        if (params.body) req.setRequestHeader('Content-Type', 'application/json')

        if (params.headers) {
          for (var key in params.headers) {
            req.setRequestHeader(key, params.headers[key])
          }
        }

        req.onload = function () {
          if ((req.status === 200) && (req.response !== '')) {
            if (params.json) {
              try {
                resolve(JSON.parse(req.response))
              } catch (e) {
                resolve(req.response)
              }
            }
          } else if (req.response === '') {
            reject('empty answer')
          } else {
            reject(req.statusText)
          }
        }

        req.timeout = params.timeout
        req.ontimeout = function () {
          console.log('getRequest timed out: ' + req.timeout)
          reject(req.statusText)
        }
        req.onerror = function () {
          reject('Network Error')
        }
        req.send(params.body && JSON.stringify(params.body))
      })
  }

  T.post = function (apiUrl, body) {
    var params = {
      url: apiUrl,
      body: body,
      method: 'POST'
    }

    return T.rp(params)
  }

  T.genId = function (len) {
    len = len || 10
    return Math.random().toString(36).substr(2, len)
  }

  T.importJs = function (src, lookFor, onload) {
    if (!isMyScriptLoaded(src)) {
      var s = document.createElement('script')
      s.setAttribute('type', 'text/javascript')
      s.setAttribute('src', src)
      if (onload) {
        waitForScriptLoad(lookFor, onload)
      }
      var head = document.getElementsByTagName('head')[0]
      if (head) {
        head.appendChild(s)
      } else {
        document.body.appendChild(s)
      }
    } else {
      if (onload) onload()
    }

    function waitForScriptLoad (lookFor, onload) {
      var interv = setInterval(function () {
        if ((typeof lookFor !== 'undefined') || (lookFor)) {
          clearInterval(interv)
          onload()
        }
      }, 50)
    }

    function isMyScriptLoaded (url) {
      var loadedScripts = document.getElementsByTagName('script')
      for (var i = loadedScripts.length; i--;) {
        if (loadedScripts[i].src == url) return true
      }
      return false
    }
  }

  T.importCss = function (href, lookFor, onload) {
    if (!isMyLinkLoaded(href)) {
      var s = document.createElement('link')
      s.setAttribute('rel', 'stylesheet')
      s.setAttribute('href', href)
      if (onload) waitForScriptLoad(lookFor, onload)
      var head = document.getElementsByTagName('head')[0]
      if (head) {
        head.appendChild(s)
      } else {
        document.body.appendChild(s)
      }
    } else {
      if (onload) onload()
    }

    function waitForScriptLoad (lookFor, onload) {
      var interv = setInterval(function () {
        if ((typeof lookFor !== 'undefined') || (lookFor)) {
          clearInterval(interv)
          onload()
        }
      }, 50)
    }
  }

  T.cmprArr = function (oldArr, newArr, cb) {
    var o = {
      del: [],
      add: []
    }

    var newSet = {}

    var i1 = 0
    var l1 = oldArr.length

    ;(function iter () {
      var oldItem = oldArr[i1]
      var strOld = JSON.stringify(oldItem)
      var matchOld = false

      for (var i2 = 0; i2 < newArr.length; i2++) {
        var newItem = newArr[i2]
        var newStr = JSON.stringify(newItem)

        if (i1 === 0) newSet[newStr] = newItem

        if (strOld == newStr) {
          matchOld = true
          delete newSet[newStr]
          if (i1 !== 0) break
        }
      }

      if (!matchOld) o.del.push(oldItem)

      i1++
      if (i1 < l1) iter()
      else {
        for (var key in newSet) {
          var item = newSet[key]
          o.add.push(item)
        }

        cb(o)
      }
    })()
  }

  T.getTextareaArr = function (node) {
    if (typeof node == 'string') node = document.querySelector(node)

    var textareaArr = node.value.trim().split(/\n\r?/).filter(function (a) {
      return a
    })
    return textareaArr
  }

  T.getTsv = function (arr, delim) {
    delim = delim || '\t'

    var rowArr = []
    var columns = {}

    for (var i = 0; i < arr.length; i++) { //собираем все ключи со всех объектов, а не только с первого
      for (var key in arr[i]) {
      columns[key] = true
      }
    }

    rowArr.push(Object.keys(columns).join(delim)) //добавляем названия колонок

    for (var j = 0; j < arr.length; j++) {
      var obj = arr[j]
      var valArr = []
      for (var prop in obj) {
        var val = obj[prop]
        valArr.push(val)
      }
      var rowStr = valArr.join(delim)
      rowArr.push(rowStr)
    }
    return rowArr.join('\n')
  }

  T.copy2Clip = function (str) {
    var textarea = document.createElement('textarea')
    textarea.value = str
    textarea.setAttribute('value', str)
    textarea = document.body.appendChild(textarea)
    textarea.select()

    try {
      if (!document.execCommand('copy')) throw 'Not allowed.'
    } catch (e) {
      textarea.remove()
      console.log("document.execCommand('copy'); is not supported")
      prompt('Copy the text (ctrl c, enter)', str)
    } finally {
      if (typeof e == 'undefined') {
        textarea.remove()
      }
    }
  }

  T.convUpperFirst = function (str) {
    if (!str) return
    if (typeof str !== 'string') throw Error('str !== string')

    str = str.trim()

    var finStr = ''

    for (var i = 0; i < str.length; i++) {
      var l = str[i]

      var reLetters = /[а-яеґёіїє]/i
      var reDelims = /[\- ]/

      if (!reLetters.test(str)) {
        finStr += l
      } else if (i === 0) {
        finStr += l.toUpperCase()
      } else {
        var prev = finStr.slice(-1)
        if (reDelims.test(prev)) {
          finStr += l.toUpperCase()
        } else finStr += l.toLowerCase()
      }
    }

    return finStr
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = T
  }
})()
