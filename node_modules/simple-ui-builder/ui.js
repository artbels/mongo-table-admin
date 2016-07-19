/**
 * Simple UI Builder
 * @ artbels
 * artbels@gmail.com
 * 2016
 */

(function() {

  var UI = this.UI = {};

  UI.input = function(params, cb) {

    params = params || {};

    cb = cb || params.cb || function(value) {
      console.log("you pressed enter and input value is >> " + value + " <<");
    };

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    if (typeof params == "string") params = {
      id: params
    };

    params.id = params.id || "input";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var input = document.createElement("input");
    input.id = params.id;
    input.type = "text";

    if(params.placeholder) input.placeholder = params.placeholder;
    input.name = params.name || params.id;

    if ((params.class !== undefined) || (params.className !== undefined)) {
      input.className = params.class || params.className;
    } else input.className = "form-control"; //yes, I like bootstrap

    if (params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        input.style[key] = val;
      }
    }

    input.style.width = input.style.width || "300px";
    input.style.marginTop = input.style.marginTop || "5px";
    input.style.marginBottom = input.style.marginBottom || "5px";
    
    if(params.value === undefined) {
      input.value = localStorage["input#" + params.id] || "";
    } else input.value = params.value;

    input.onkeyup = saveContents;
    input.onchange = saveContents;

    function saveContents(e) {
      localStorage["input#" + params.id] = input.value.trim();

      if (e.keyCode === 13) { //checks whether the pressed key is "Enter"
        cb(input.value);
      }
    }

    params.parent.appendChild(input);
  };


  UI.button = function(cb, params) {

    params = params || {};

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    cb = cb || function() {
      console.log("button clicked");
    };

    if (typeof params == "string") params = {
      title: params,
      id: params
    };

    params.id = params.id || "button";
    params.className = (params.class !== undefined) ? params.class : ((params.className !== undefined) ? params.className : "btn btn-default");
    params.innerHTML = params.innerHTML || params.title || "Action";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var button = document.createElement("button");
    button.id = params.id;
    button.className = params.className;
    button.innerHTML = params.innerHTML;
    if(params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        button.style[key] = val;
      }
    }
    button.style.margin = button.style.margin || params.margin || "10px";
    button.onclick = function () {
      cb(button.id);
    };
    params.parent.appendChild(button);
  };


  UI.br = function(params) {

    params = params || {};

    if (typeof params == "string") {
      params = {
        parent: document.querySelector(params)
      };
    } else if (params instanceof HTMLElement) {
      params = {
        parent: params
      };
    }

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    params.id = params.id || "br";

    var br = document.createElement("br");
    br.id = params.id;
    params.parent.appendChild(br);
  };
  

  UI.radio = function(arr, params, cb) {

    if(!arr) return console.warn("no array to build radios!");

    params = params || {};

    cb = cb || params.cb || function(value) {
      console.log("you clicked radio >> " + value + " <<");
    };

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    if (typeof params == "string") params = {
      parent: document.querySelector(params)
    };

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    params.id = params.id || "radio";

    var i = 0;
    var l = arr.length;

    createRadio();

    function createRadio() {
      var item = arr[i];
      var radio = document.createElement("input");
      radio.type = "radio";
      radio.id = item;
      radio.name = params.id;
      radio.onclick = function() {
        cb(radio.id);
      };

      params.parent.appendChild(radio);
      params.parent.appendChild(document.createTextNode(item));
      if(params.br) params.parent.appendChild(document.createElement("br"));
      i++;
      if(i < l) {
        createRadio();
      }
    }
  };


  UI.checkbox = function(params, cb) {

    params = params || {};

    cb = cb || params.cb || function(value) {
      console.log("you clicked checkbox >> " + value + " <<");
    };

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    if (typeof params == "string") params = {
      text: params,
      id: params
    };

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    params.id = params.id || "checkbox";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = params.id;
    checkbox.checked = Boolean(params.checked);
    checkbox.onclick = function() {
        cb(checkbox.checked);
    };
    params.parent.appendChild(checkbox);

    if(params.text) params.parent.appendChild(document.createTextNode(params.text));
  };


  UI.fileReader = function(cb, params) {

    params = params || {};

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    cb = cb || params.cb || function(d) {
      console.log(d);
    };

    params.id = params.id || "file-reader";
    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var fileInput = document.createElement("input");
    params.parent.appendChild(fileInput);
    fileInput.type = "file";
    fileInput.id = params.id;
    fileInput.onchange = function(evt) {
      var fileToRead = evt.target.files[0];
      var fileType = fileToRead.name.split(/\./).pop();
      if (parent.bypassFileReader) return cb(fileToRead);
      var fileReader = new FileReader();
      fileReader.onload = function(e) {
        var contents = e.target.result;
        if (params.json && (["{", "["].indexOf(contents.slice(0, 1)) != -1)) contents = JSON.parse(contents);
        cb(contents, fileToRead);
      };

      if ((["zip", "kmz"].indexOf(fileType) != -1) || (params.readAsArrayBuffer)) {
        fileReader.readAsArrayBuffer(fileToRead);
      } else if ((["xls", "xlsx"].indexOf(fileType) != -1) || (params.readAsBinaryString)) {
        fileReader.readAsBinaryString(fileToRead);
      } else {
        fileReader.readAsText(fileToRead, params.encoding);
      }
    };
  };


  UI.download = function(str, params) {

    params = params || {};

    if(!str) console.warn("nothing to save!");

    if(typeof str == "object") str = JSON.stringify(str, null, "\t");

    params.id = params.id || params.name || "download-link";
    params.name = params.name || "renameMe.json";
    params.type = params.type || "application/json";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var a = document.createElement('a');

    if (params.noBlob) {
      var data = params.type + encodeURIComponent(str);
      a.href = 'data:' + data;
    } else {
      var blobObj = new Blob([str], {
        type: params.type
      });
      var blobUrl = URL.createObjectURL(blobObj);
      a.href = blobUrl;
    }

    a.download = params.name;
    a.textContent = params.name;
    a.id = params.id;
    if(params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        a.style[key] = val;
      }
    }
    params.parent.appendChild(a);
  };


  UI.span = function(params) {

    if (typeof params == "string") params = {
      innerHTML: params,
    };

    if (!params.innerHTML) return "no innerHTML";

    params.id = params.id || "span";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var span = document.createElement("span");
    span.innerHTML = params.innerHTML;
    span.id = params.id;
    if(params.className) span.className = params.className;
    if(params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        span.style[key] = val;
      }
    }
    params.parent.appendChild(span);
  };


  UI.img = function(params) {

    if (typeof params == "string") params = {
      src: params,
    };

    if (!params.src) return "no src";

    params.id = params.id || "img";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var img = document.createElement("img");
    img.src = params.src;
    if(params.alt) img.alt = params.alt;
    img.id = params.id;
    if(params.className) img.className = params.className;
    if(params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        img.style[key] = val;
      }
    }
    params.parent.appendChild(img);
  };


  UI.link = function(params) {

    if (typeof params == "string") params = {
      href: params,
      title: params
    };

    if (!params.href) return "no href";

    params.id = params.id || "link";
    params.innerHTML = params.innerHTML || params.href;

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id);
    if (exNode) params.parent.removeChild(exNode);

    var a = document.createElement("a");
    a.id = params.id;
    a.href = params.href;
    if(params.targetBlank) a.target = "_blank";
    a.innerHTML = params.innerHTML;
    if(params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        a.style[key] = val;
      }
    }
    params.parent.appendChild(a);
  };


  UI.select = function(arr, cb, params) {

    if(!arr) return console.warn("no array to build select!");

    params = params || {};

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    params.id = params.id || "";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    var exNode = document.getElementById(params.id + "Select");
    if (exNode) params.parent.removeChild(exNode);

    cb = cb || function(selectedOption) {
      console.log(selectedOption);
    };

    var select = document.createElement("select");
    select.className = "selectpicker";
    select.id = params.id + "Select";

    var firstOption = document.createElement("option");
    firstOption.innerHTML = "select " + params.id;
    select.appendChild(firstOption);

    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];

      var option = document.createElement("option");
      option.id = params.id + "Option";
      option.innerHTML = params.innerHTML || item;
      option.value = params.value || item;
      select.appendChild(option);
    }
    params.parent.appendChild(select);

    select.onchange = function() {
      var selectedOption = document.querySelector("option#" + params.id + "Option" + ":checked").value;
      cb(selectedOption);
    };
  };


  UI.TB = function(cb, params) {

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    params = params || {};
    params.id = params.id || "textarea";
    params.cols = params.cols || "60";
    params.rows = params.rows || "12";
    params.fontSize = params.fontSize || "12px";

    if (typeof params.parent == "string") params.parent = document.querySelector(params.parent);
    else params.parent = params.parent || document.body;

    cb = cb || function(d) {
      console.log(d);
    };

    var textarea = document.createElement("textarea");
    textarea.cols = params.cols;
    textarea.rows = params.rows;
    textarea.id = params.id;
    textarea.style.fontFamily = "monospace";
    textarea.style.fontSize = params.fontSize;
    params.parent.appendChild(textarea);

    textarea.value = localStorage[params.id] || params.content || "";

    textarea.onkeyup = saveContents;
    textarea.onchange = saveContents;

    function saveContents() {
      localStorage[params.id] = textarea.value.trim();
    }

    params.parent.appendChild(document.createElement("br"));

    var actionButton = document.createElement("button");
    actionButton.id = params.id + "Action";
    actionButton.innerHTML = params.buttonText || "Action";
    if (!params.noAction) {
      params.parent.appendChild(actionButton);
    }
    actionButton.onclick = function() {
      var textareaArr = textarea.value.trim().split(/\n\r?/).filter(function(a) {
        return a;
      });
      cb(textareaArr);
    };

    var clearButton = document.createElement("button");
    clearButton.innerHTML = "Clear";
    params.parent.appendChild(clearButton);

    clearButton.onclick = function() {
      textarea.value = "";
      localStorage[params.id] = "";
    };
  };


})();