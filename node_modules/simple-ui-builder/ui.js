/**
 * Simple UI Builder
 * @ artbels
 * artbels@gmail.com
 * 2016
 */

;(function () {
  var UI = this.UI = {}

  UI.input = function (params, cb) {
    params = params || {}

    cb = cb || params.cb || function (value) {
      console.log('you pressed enter and input value is >> ' + value + ' <<')
    }

    if ((typeof params == 'function') && (typeof cb == 'object')) {
      var temp = params
      params = cb
      cb = temp
    }

    if (typeof params == 'string') params = {
        id: params
    }

    params.id = params.id || 'input'

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var input = document.createElement('input')
    input.id = params.id
    input.type = params.type || 'text'

    if (params.placeholder) input.placeholder = params.placeholder
    input.name = params.name || params.id

    if ((params.class !== undefined) || (params.className !== undefined)) {
      input.className = params.class || params.className
    } else input.className = 'form-control'; // yes, I like bootstrap

    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        input.style[key] = val
      }
    }

    input.style.width = input.style.width || '300px'
    input.style.marginTop = input.style.marginTop || '5px'
    input.style.marginBottom = input.style.marginBottom || '5px'

    if (params.value === undefined) {
      input.value = localStorage['input#' + params.id] ||
        params.default || ''
    } else input.value = params.value

    input.onkeyup = saveContents
    input.onchange = saveContents

    function saveContents (e) {
      localStorage['input#' + params.id] = input.value.trim()

      if (e.keyCode === 13) { // checks whether the pressed key is "Enter"
        cb(input.value)
      }
    }

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        input.setAttribute(attribute, val)
      }
    }

    params.parent.appendChild(input)
  }

  UI.button = function (cb, params) {
    if (typeof cb == 'object') {
      if (typeof params == 'function') {
        var temp = params
        params = cb
        cb = temp
      } else if (typeof params == 'undefined') {
        params = cb
        cb = console.log
      }
    }

    if (typeof cb == 'string') {
      if (typeof params == 'function') {
        var temp2 = params
        params = {
          innerHTML: cb
        }
        cb = temp2
      } else if (typeof params == 'undefined') {
        params = {
          innerHTML: cb
        }
        cb = console.log
      }
    }

    params = params || {}

    cb = cb || function (id) {
      console.log(id + ' clicked')
    }

    params.className = (params.class !== undefined) ?
      params.class :
      ((params.className !== undefined) ?
        params.className :
        'btn btn-default')

    params.innerHTML = params.innerHTML || params.title || 'Action'

    params.id = params.id || UI.slug(params.innerHTML)

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var button = document.createElement('button')
    button.id = params.id
    button.className = params.className
    button.innerHTML = params.innerHTML
    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        button.style[key] = val
      }
    }
    button.style.margin = button.style.margin || params.margin || '10px'

    button.onclick = function () {
      cb(button.id)
    }

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        button.setAttribute(attribute, val)
      }
    }

    params.parent.appendChild(button)
  }

  UI.buttons = function (arr, cb, params) {
    if (!arr || !arr.length)
      return console.warn('no array to build buttons!')

    if (typeof cb == 'object') {
      if (typeof params == 'function') {
        var temp = params
        params = cb
        cb = temp
      } else if (typeof params == 'undefined') {
        params = cb
        cb = console.log
      }
    }

    params = params || {}

    cb = cb || function (id) {
      console.log(id + ' clicked')
    }

    if (typeof params == 'string') params = {
        innerHTML: params,
        id: params
    }

    var i = 0
    var l = arr.length

    ;(function next () {
      var item = arr[i]

      if (typeof item == 'number') item = item.toString()
      var buttonParams = {
        parent: params.parent,
        innerHTML: item,
        style: {
          margin: '2px'
        }
      }
      UI.button(cb, buttonParams)
      i++
      if (i < l) next()
    })()
  }

  UI.br = function (params) {
    params = params || {}

    if (typeof params == 'string') {
      params = {
        parent: document.querySelector(params)
      }
    } else if (typeof params == 'number') {
      params = {
        id: params.toString()
      }
    } else if (params instanceof HTMLElement) {
      params = {
        parent: params
      }
    }

    if (typeof params.parent == 'string')
      params.parent = document.querySelector(params.parent)
    else params.parent = params.parent || document.querySelector('#ui') ||
      document.body

    params.id = params.id || 'br'

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var br = document.createElement('br')
    br.id = params.id
    params.parent.appendChild(br)
  }

  UI.radio = function (arr, params, cb) {
    if (!arr || !arr.length)
      return console.warn('no array to build radios!')

    params = params || {}

    cb = cb || params.cb || function (value) {
      console.log('you clicked radio >> ' + value + ' <<')
    }

    if ((typeof params == 'function') && (typeof cb == 'object')) {
      var temp = params
      params = cb
      cb = temp
    }

    if (typeof params == 'string') params = {
        parent: document.querySelector(params)
    }

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    params.id = params.id || 'radio'

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var i = 0
    var l = arr.length

    createRadio()

    function createRadio () {
      var item = arr[i]
      var radio = document.createElement('input')
      radio.type = 'radio'
      radio.id = item
      radio.name = params.id

      if (params.default && (params.default == item)) {
        radio.checked = true
      }

      radio.onclick = function () {
        cb(radio.id)
      }

      if (params.attributes) {
        for (var attribute in params.attributes) {
          var val = params.attributes[attribute]
          radio.setAttribute(attribute, val)
        }
      }

      params.parent.appendChild(radio)
      params.parent.appendChild(document.createTextNode(item))
      if (params.br) params.parent.appendChild(document.createElement('br'))
      i++
      if (i < l) {
        createRadio()
      }
    }
  }

  UI.checkbox = function (params, cb) {
    params = params || {}

    cb = cb || params.cb || function (value) {
      console.log('you clicked checkbox >> ' + value + ' <<')
    }

    if ((typeof params == 'function') && (typeof cb == 'object')) {
      var temp = params
      params = cb
      cb = temp
    }

    if (typeof params == 'string') params = {
        text: params,
        id: params
    }

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    params.id = params.id || 'checkbox'

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = params.id
    checkbox.checked = Boolean(params.checked)
    checkbox.onclick = function () {
      cb(checkbox.id + ' ' + checkbox.checked)
    }

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        checkbox.setAttribute(attribute, val)
      }
    }

    params.parent.appendChild(checkbox)

    if (params.text) {
      var spanParams = {
        parent: params.parent,
        id: UI.slug(params.id) + '-span',
        innerHTML: params.text
      }

      var exSpanNode = document.getElementById(spanParams.id)
      if (exSpanNode) params.parent.removeChild(exSpanNode)
      UI.span(spanParams)
    }
  }

  UI.checkboxes = function (arr, cb, params) {
    if (!arr || !arr.length)
      return console.warn('no array to build buttons!')

    if (typeof cb == 'object') {
      if (typeof params == 'function') {
        var temp = params
        params = cb
        cb = temp
      } else if (typeof params == 'undefined') {
        params = cb
        cb = console.log
      }
    }

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    params = params || {}

    cb = cb || function (id) {
      console.log(id + ' checked')
    }

    var i = 0
    var l = arr.length

    ;(function next () {
      var item = arr[i]

      if (typeof item == 'number') item = item.toString()
      var checkboxParams = {
        parent: params.parent,
        checked: Boolean(params.checked),
        text: item,
        id: UI.slug(item),
        style: {
          margin: '2px'
        }
      }
      UI.checkbox(cb, checkboxParams)
      if (params.br) params.parent.appendChild(document.createElement('br'))

      i++
      if (i < l) next()
    })()
  }

  UI.fileReader = function (cb, params) {
    params = params || {}

    if ((typeof params == 'function') && (typeof cb == 'object')) {
      var temp = params
      params = cb
      cb = temp
    }

    cb = cb || params.cb || console.log

    params.id = params.id || 'file-reader'
    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var fileInput = document.createElement('input')
    params.parent.appendChild(fileInput)
    fileInput.type = 'file'
    fileInput.id = params.id

    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        fileInput.style[key] = val
      }
    }

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        fileInput.setAttribute(attribute, val)
      }
    }

    fileInput.onchange = function (evt) {
      var fileToRead = evt.target.files[0]
      var fileType = fileToRead.name.split(/\./).pop()

      if (parent.bypassFileReader) return cb(fileToRead)
      var fileReader = new FileReader()
      fileReader.onload = function (e) {
        var contents = e.target.result
        if (params.json && (['{', '['].indexOf(contents.slice(0, 1)) != -1))
          contents = JSON.parse(contents)

        cb(contents, fileToRead)
      }

      if ((['zip', 'kmz'].indexOf(fileType) != -1) ||
        (params.readAsArrayBuffer)) {
        fileReader.readAsArrayBuffer(fileToRead)
      } else if ((['xls', 'xlsx'].indexOf(fileType) != -1) ||
        (params.readAsBinaryString)) {
        fileReader.readAsBinaryString(fileToRead)
      } else {
        fileReader.readAsText(fileToRead, params.encoding)
      }
    }
  }

  UI.download = function (str, params) {
    params = params || {}

    if (!str) console.warn('nothing to save!')

    if (typeof str == 'object') str = JSON.stringify(str, null, '\t')

    params.id = params.id || params.name || 'download-link'
    params.name = params.name || 'renameMe.json'
    params.type = params.type || 'application/json'

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var a = document.createElement('a')

    if (params.noBlob) {
      var data = params.type + encodeURIComponent(str)
      a.href = 'data:' + data
    } else {
      var blobObj = new Blob([str], {
        type: params.type
      })
      var blobUrl = URL.createObjectURL(blobObj)
      a.href = blobUrl
    }

    a.download = params.name
    a.textContent = params.name
    a.id = params.id
    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        a.style[key] = val
      }
    }
    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        a.setAttribute(attribute, val)
      }
    }
    params.parent.appendChild(a)
  }

  UI.span = function (params) {
    if (typeof params == 'string') params = {
        innerHTML: params
    }

    if (!params.innerHTML) return 'no innerHTML'

    params.id = params.id || UI.slug(params.innerHTML)

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var span = document.createElement('span')
    span.innerHTML = params.innerHTML
    span.id = params.id
    if (params.className) span.className = params.className
    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        span.style[key] = val
      }
    }
    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        span.setAttribute(attribute, val)
      }
    }
    params.parent.appendChild(span)
  }

  UI.img = function (params) {
    if (typeof params == 'string') params = {
        src: params
    }

    if (!params.src) return 'no src'

    params.id = params.id || 'img'

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var img = document.createElement('img')
    img.src = params.src
    if (params.alt) img.alt = params.alt
    img.id = params.id
    if (params.className) img.className = params.className
    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        img.style[key] = val
      }
    }
    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        img.setAttribute(attribute, val)
      }
    }
    params.parent.appendChild(img)
  }

  UI.link = function (params) {
    if (typeof params == 'string') params = {
        href: params,
        title: params
    }

    if (!params.href) return 'no href'

    params.innerHTML = params.innerHTML || params.href

    params.id = params.id || UI.slug(params.innerHTML)

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var a = document.createElement('a')
    a.id = params.id
    a.href = params.href
    if (params.targetBlank) a.target = '_blank'
    a.innerHTML = params.innerHTML

    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        a.style[key] = val
      }
    }

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        a.setAttribute(attribute, val)
      }
    }

    params.parent.appendChild(a)
  }

  UI.select = function (arr, cb, params) {
    if (!arr || !arr.length)
      return console.warn('no array to build select!')

    if ((typeof params == 'function') && (typeof cb == 'object')) {
      var temp = params
      params = cb
      cb = temp
    }

    if (!params && (typeof cb == 'object')) {
      params = cb
      cb = console.log
    }

    params = params || {}

    params.id = params.id || ''

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id + 'Select')
    if (exNode) params.parent.removeChild(exNode)

    cb = cb || console.log

    var select = document.createElement('select')
    select.className = params.className || 'selectpicker'
    select.id = params.id + 'Select'

    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        select.style[key] = val
      }
    }

    var firstOption = document.createElement('option')
    firstOption.innerHTML = params.firstRowText || 'select ' + params.id
    select.appendChild(firstOption)

    for (var i = 0; i < arr.length; i++) {
      var item = arr[i]

      var option = document.createElement('option')
      option.id = params.id + 'Option'
      option.innerHTML = params.innerHTML || item
      option.value = params.value || item

      if (params.default && params.default == item) {
        option.selected = true
      }

      select.appendChild(option)
    }
    params.parent.appendChild(select)

    select.onchange = function () {
      var selectedOptionNode =
      document.querySelector('option#' + params.id + 'Option' + ':checked')
      if (selectedOptionNode) cb(selectedOptionNode.value)
    }
  }

  UI.textarea = function (params) {
    params = params || {}
    params.id = params.id || 'textarea'
    params.cols = (params.cols || 60).toString()
    params.rows = (params.rows || 12).toString()
    params.fontSize = params.fontSize || '12px'

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var textarea = document.createElement('textarea')
    textarea.cols = params.cols
    textarea.rows = params.rows
    textarea.id = params.id
    textarea.className = params.className || params.class || 'form-control'

    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key]
        textarea.style[key] = val
      }
    }

    textarea.style.fontFamily = 'monospace'
    textarea.style.fontSize = params.fontSize

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        textarea.setAttribute(attribute, val)
      }
    }

    params.parent.appendChild(textarea)

    textarea.value = localStorage['textarea#' + params.id] ||
      params.value || ''

    textarea.onkeyup = saveContents
    textarea.onchange = saveContents

    function saveContents (e) {
      localStorage['textarea#' + params.id] = textarea.value.trim()
    }
  }

  UI.TB = function (cb, params) {
    if ((typeof params == 'function') && (typeof cb == 'object')) {
      var temp = params
      params = cb
      cb = temp
    }

    cb = cb || console.log

    params = params || {}

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    params.className = ''
    UI.textarea(params)

    params.parent.appendChild(document.createElement('br'))

    var textareaId = params.id
    var textareaNode = document.querySelector('textarea#' + params.id)

    if (!params.noAction) {
      var actionParams = {}
      actionParams.parent = params.parent
      actionParams.id = params.id + 'Action'
      actionParams.innerHTML = params.buttonText || 'Action'
      actionParams.className = ''
      actionParams.style = {
        margin: '0px'
      }

      UI.button(actionParams, function () {
        var textareaArr = textareaNode.value
          .trim()
          .split(/\n\r?/).filter(function (a) {
          return a
        })
        cb(textareaArr)
      })
    }

    var clearParams = {}
    clearParams.parent = params.parent
    clearParams.id = params.id + 'Clear'
    clearParams.innerHTML = 'Clear'
    clearParams.className = ''
    clearParams.style = {
      margin: '0px',
      marginLeft: '5px'
    }

    UI.button(clearParams, function () {
      textareaNode.value = ''
      localStorage[textareaId] = ''
    })
  }

  UI.table = function (arr, params) {
    if ((!arr) && (typeof (arr[0]) != 'object')) {
      alert('Argument is not an array with objects')
    }

    if (typeof arr[0] != 'object') arr = arr.map(function (a) {
        return {
          value: a
        }
      })

    var reDateTimeJS = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/

    if (typeof params == 'string') params = {
        parent: params
    }

    params = params || {}
    if (typeof params.selectable != 'boolean') params.selectable = false

    params.tableId = params.tableId || params.id || 'printedTable'
    params.showColumns = params.showColumns ||
    params.columns || params.cols || []

    params.hideColumns = params.hideColumns || []

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    if (typeof params.hideHead != 'boolean') params.hideHead = false
    if (typeof params.sortColumns != 'boolean') params.sortColumns = false

    // console.log(params)
    var columns = []
    var numCol = {}
    var cell = ''
    var chBoxCol

    if (params.showColumns.length !== 0) {
      columns = params.showColumns
    } else {
      for (var i = 0; i < arr.length; i++) { // собираем ключи со всех объектов
        for (var key in arr[i]) {
          if ((columns.indexOf(key) == -1) &&
            (params.hideColumns.indexOf(key) == -1)) {
            columns.push(key)

            var colCell = arr[i][key]
            numCol[key] = (!isNaN(colCell) && (typeof colCell == 'number'))
          }
        }
      }
    }

    if (params.sortColumns) columns.sort()

    var exTable = document.getElementById(params.tableId)
    if (exTable) params.parent.removeChild(exTable)

    var table = document.createElement('table')
    table.id = params.tableId

    if (params.style) {
      for (var style in params.style) {
        var val = params.style[style]
        table.style[style] = val
      }
    }

    table.style.margin = table.style.margin || '10px'
    table.style.fontFamily = table.style.fontFamily || 'monospace'
    table.style.width = table.style.width || 'auto 90%'
    table.style.borderCollapse = table.style.borderCollapse || 'collapse'

    params.parent.appendChild(table)

    if (!params.hideHead) {
      var thead = table.createTHead()
      var hRow = thead.insertRow(0)
      if (params.selectable) {
        var thh = document.createElement('th')

        thh.style.background = '#f6f6f6'
        thh.style.padding = '3px'
        thh.style.border = '1px solid black'

        chBoxCol = document.createElement('input')
        chBoxCol.id = params.tableId + 'ColCheckbox'
        chBoxCol.type = 'checkbox'
        chBoxCol.checked = Boolean(params.checked)

        thh.appendChild(chBoxCol)
        hRow.appendChild(thh)
      }

      for (var h = 0; h < columns.length; h++) {
        var th = document.createElement('th')
        th.style.background = '#f6f6f6'
        th.style.padding = '3px'
        th.style.border = '1px solid black'

        th.appendChild(document.createTextNode(columns[h]))
        hRow.appendChild(th)
      }
    }

    var tbody = document.createElement('tbody')
    table.appendChild(tbody)

    if (arr.length !== 0) {
      for (var n = 0; n < arr.length; n++) { // собираем данные полей, чистим
        var dRow = tbody.insertRow(-1)
        dRow.id = n
        var oneObj = arr[n]
        if (params.selectable) {
          var tdch = document.createElement('td')
          tdch.style.padding = '3px'
          tdch.style.border = '1px solid black'

          var chBoxRow = document.createElement('input')
          chBoxRow.className = params.tableId + 'RowCheckbox'
          chBoxRow.id = n
          chBoxRow.type = 'checkbox'
          chBoxRow.checked = Boolean(params.checked)
          tdch.appendChild(chBoxRow)
          dRow.appendChild(tdch)
        }
        for (var l = 0; l < columns.length; l++) {
          cell = oneObj[columns[l]]
          cell = (((cell !== undefined) && (cell !== null)) ? cell : '')
          if (cell.constructor === Array) cell = cell.join(', ')
          if (cell.constructor === Object) cell = JSON.stringify(cell)

          if (typeof cell == 'string') {
            cell = cell.replace(params.quotes, "'")
            if (reDateTimeJS.test(cell)) cell =
                new Date(cell).toLocaleDateString()
          }

          var td = document.createElement('td')

          if (/<a.+<\/a>/.test(cell)) {
            td.appendChild(new DOMParser()
              .parseFromString(cell, 'text/html')
              .querySelector('a'))
          } else if (/<img.+?>/.test(cell)) {
            td.appendChild(new DOMParser()
              .parseFromString(cell, 'text/html')
              .querySelector('img'))
          } else if (/<input.+?>/.test(cell)) {
            td.appendChild(new DOMParser()
              .parseFromString(cell, 'text/html')
              .querySelector('input'))
          } else {
            td.appendChild(document.createTextNode(cell))
          }

          td.style.padding = '3px'
          td.style.border = '1px solid black'

          dRow.appendChild(td)
        }
      }
    }

    if (chBoxCol) {
      chBoxCol.onchange = function () {
        var checkboxes =
        document.querySelectorAll('.' + params.tableId + 'RowCheckbox')

        for (var i = 0; i < checkboxes.length; i++) {
          checkboxes[i].checked = !checkboxes[i].checked
        }
      }
    }
  }

  UI.addRow = function (obj, params) {
    params = params || {}
    params.selectable = params.selectable || false
    params.mdl = params.mdl || false
    params.showColumns = params.showColumns || params.cols || params.columns || []
    params.tableId = params.tableId || params.id || 'printedTable'

    var tableExists = document.getElementById(params.tableId)
    if (!tableExists) Table.print([], params)

    var reDateTimeJS = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/

    var columns = []
    var cell = ''

    if (params.showColumns.length !== 0) {
      columns = params.showColumns
    } else {
      columns = Object.keys(obj)
    }
    var tbody = document.querySelector('#' + params.tableId).querySelector('tbody')
    var dRow = tbody.insertRow(-1)

    if (params.selectable) {
      var tds = document.createElement('td')
      if (!params.mdl) {
        tds.style.padding = '3px'
        tds.style.border = '1px solid black'
      }
      var chBoxRow = document.createElement('input')
      chBoxRow.className = params.tableId + 'RowCheckbox'
      chBoxRow.type = 'checkbox'
      chBoxRow.checked = Boolean(params.checked)
      tds.appendChild(chBoxRow)
      dRow.appendChild(tds)
    }

    for (var i = 0; i < columns.length; i++) {
      var td = document.createElement('td')
      if (!params.mdl) {
        td.style.padding = '3px'
        td.style.border = '1px solid black'
      }
      cell = obj[columns[i]]
      cell = (((cell !== undefined) && (cell !== null)) ? cell : '')
      if (cell.constructor === Array) cell = cell.join(', ')
      else if (cell.constructor === Object) cell = JSON.stringify(cell)
      else if (typeof cell == 'string') {
        cell = cell.replace(params.quotes, "'")
        if (reDateTimeJS.test(cell)) cell = new Date(cell).toLocaleDateString()
      }

      if (/<a.+<\/a>/.test(cell)) {
        td.appendChild(new DOMParser().parseFromString(cell, 'text/html').querySelector('a'))
      } else if (/<img.+?>/.test(cell)) {
        td.appendChild(new DOMParser().parseFromString(cell, 'text/html').querySelector('img'))
      } else {
        td.appendChild(document.createTextNode(cell))
      }
      if (!params.mdl) {
        td.style.padding = '3px'
        td.style.border = '1px solid black'
      } else {
        if (!numCol[columns[l]]) { // select first col with non-num
          td.className = 'mdl-data-table__cell--non-numeric'
        }
      }
      dRow.appendChild(td)
    }
  }

  UI.getTableSel = function (tableId) {
    var checkboxes = document.querySelectorAll('.' + tableId + 'RowCheckbox')
    var checkedArr = []
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) checkedArr.push(i)
    }
    return checkedArr
  }

  UI.div = function (params) {
    params = params || {}

    if (typeof params == 'string') {
      params = {
        id: params
      }
    }

    if (typeof params.parent == 'string') {
      params.parent = document.querySelector(params.parent)
    } else params.parent = params.parent ||
      document.querySelector('#ui') || document.body

    var exNode = document.getElementById(params.id)
    if (exNode) params.parent.removeChild(exNode)

    var div = document.createElement('div')

    div.id = params.id || 'div'
    div.className = params.className

    if (params.attributes) {
      for (var attribute in params.attributes) {
        var val = params.attributes[attribute]
        div.setAttribute(attribute, val)
      }
    }

    params.parent.appendChild(div)
  }

  UI.appendModal = function (params) {
    // requires bootstrap

    params = params || {}
    params.id = params.id || 'modal'
    params.title = params.title || 'Modal title'

    var fadeDiv = document.createElement('div')
    fadeDiv.id = params.id
    fadeDiv.setAttribute('class', 'modal fade')
    fadeDiv.setAttribute('role', 'dialog')
    document.body.appendChild(fadeDiv)

    var dialogDiv = document.createElement('div')
    dialogDiv.setAttribute('class', 'modal-dialog')
    fadeDiv.appendChild(dialogDiv)

    var contentDiv = document.createElement('div')
    contentDiv.setAttribute('class', 'modal-content')
    dialogDiv.appendChild(contentDiv)

    var headerDiv = document.createElement('div')
    headerDiv.setAttribute('class', 'modal-header')
    headerDiv.style.padding = '10px'
    contentDiv.appendChild(headerDiv)

    var closeButton = document.createElement('button')
    closeButton.setAttribute('class', 'close')
    closeButton.setAttribute('data-dismiss', 'modal')
    closeButton.innerHTML = '&times;'
    headerDiv.appendChild(closeButton)

    var h4 = document.createElement('h4')
    h4.setAttribute('class', 'modal-title')
    h4.innerHTML = params.title
    headerDiv.appendChild(h4)

    var bodyDiv = document.createElement('div')
    bodyDiv.id = params.id + '-body'
    contentDiv.appendChild(bodyDiv)

    var footerDiv = document.createElement('div')
    footerDiv.id = params.id + '-footer'
    contentDiv.appendChild(footerDiv)
  }

  UI.slug = function (str) {
    if (!str) return

    if (typeof str === 'number') return str

    var letterMap = {
      '/': '_',
      '\\': '_',
      'а': 'a',
      'б': 'b',
      'в': 'v',
      'г': 'g',
      'д': 'd',
      'е': 'e',
      'ж': 'zh',
      'з': 'z',
      'и': 'i',
      'й': 'y',
      'к': 'k',
      'л': 'l',
      'м': 'm',
      'н': 'n',
      'о': 'o',
      'п': 'p',
      'р': 'r',
      'с': 's',
      'т': 't',
      'у': 'u',
      'ф': 'f',
      'х': 'kh',
      'ц': 'ts',
      'ч': 'ch',
      'ш': 'sh',
      'щ': 'sch',
      'ы': 'i',
      'ь': '',
      'ъ': '',
      'э': 'e',
      'ю': 'yu',
      'я': 'ya',
      'ё': 'e',
      'є': 'e',
      'і': 'i',
      'ї': 'yi',
      'ґ': 'g',
      '+': '-plus'
    }

    var reOtherSymbols = /[^a-z0-9\-_]/gi

    var replLetters = str.split('').map(function (char) {
      char = char.toLowerCase()
      return (letterMap[char] !== undefined) ? letterMap[char] : char
    }).join('')

    var replSymb = replLetters.replace(reOtherSymbols, '-')

    var replUnnecDelims = removeUnnecessaryDelims(replSymb)

    return replUnnecDelims

    function removeUnnecessaryDelims (str) {
      return str
        .replace(/\-{2,}/g, '-')
        .replace(/_{2,}/g, '_')
        .replace(/[\-\_]+$/g, '')
        .replace(/^[\-\_]+/g, '')
    }
  }
})()
