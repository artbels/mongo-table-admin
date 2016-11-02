/**
 * Cyr2lat translit
 * @ artbels
 * artbels@gmail.com
 * 2016
 * ver 1.0.0
 *
 */

;(function () {
  var Translit = this.Translit = function (input) {
    var letterMap = {
      '/': '_',
      '\\': '_',
      "'": '',
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

    var replLetters = input.split('').map(function (char) {
      char = char.toLowerCase()
      return (letterMap[char] !== undefined) ? letterMap[char] : char
    }).join('')

    var replSymb = replLetters.replace(reOtherSymbols, '-')

    var replUnnecDelims = removeUnnecessaryDelims(replSymb)

    return replUnnecDelims

    function removeUnnecessaryDelims (input) {
      return input
        .replace(/\-{2,}/g, '-')
        .replace(/_{2,}/g, '_')
        .replace(/[\-\_]+$/g, '')
        .replace(/^[\-\_]+/g, '')
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Translit
  }
})()
