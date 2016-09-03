var assert = require('chai').assert;

var cases = {
  Translit: {
    module: require("../translit"),
    cases: {
      simple: [
        ['Киев, Вузовская ул., 5', 'kiev-vuzovskaya-ul-5'],
        [' Киев, Вузовская ул., 5 ', 'kiev-vuzovskaya-ul-5'],
        ['Блюхера Василия (Игоря Турчина) улица','blyukhera-vasiliya-igorya-turchina-ulitsa'],
        ['Киев, Апрельский пер., 12','kiev-aprelskiy-per-12'],

      ],
      mix: [
        ['kashka-малашка', 'kashka-malashka'],
        ['малашка-45', 'malashka-45'],
      ],
      'multi delims': [
        ['-.kashka__малашка-+)', 'kashka_malashka-plus'],
        ['100% малашка+)', '100-malashka-plus'],
      ],
    }
  }
};

for (var moduleName in cases) {
  var moduleObj = cases[moduleName];
  var moduleCases = moduleObj.cases;
  iterateProps(moduleCases, moduleName, moduleObj);
}

function iterateProps(moduleCases, moduleName, moduleObj) {
  describe(moduleName, function() {
    var propsArr = Object.keys(moduleCases);

    iterRec(propsArr, function(prop, cb) {
      var child = moduleCases[prop];
      describe(prop, function() {
        if (child.constructor == Object) {
          iterateProps(child, moduleName, moduleObj);
        } else if (child.constructor == Array) {
          runTests(child, moduleObj);
        }
      });
      cb();
    });
  });
}

function runTests(caseArr, moduleObj) {
  var moduleInst = moduleObj.module;

  iterRec(caseArr, function(testCase, cb) {

    var query = testCase[0];
    var res = testCase[1];
    var prop = testCase[2];

    var name = (prop ? prop + " of " : "") +
      ((typeof query == "object") ? JSON.stringify(query) : query) + " == " + res;

    it(name, function() {
      if (prop) {
        assert.equal(res, moduleInst(query)[prop]);
      } else assert.equal(res, moduleInst(query));
    });
    cb();
  });
}

function iterRec(arr, func) {
  var i = 0;
  var l = arr.length;

  (function next() {
    var item = arr[i];
    func(item, nextCb);

    function nextCb() {
      i++;
      if (i < l) next();
    }
  })();
}