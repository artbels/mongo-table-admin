/**
 * User interface elements
 * @ artbels
 * artbels@gmail.com
 * 2016
 * ver 1.1.1
 * not licensed for external use
 *
 */


(function() {

  var UI = this.UI = {};


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


  UI.download = function(str, params) {

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


  UI.checkbox = function(params) {

    params = params || {};

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
    params.parent.appendChild(checkbox);

    params.parent.appendChild(document.createTextNode(params.text));
  };


  UI.fileReader = function(cb, params) {

    params = params || {};

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    cb = cb || function(d) {
      console.log(d);
    };

    params.id = params.id || "fileReader";
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
        if ((["{", "["].indexOf(contents.slice(0, 1)) != -1) && params.json) contents = JSON.parse(contents);
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


  UI.select = function(arr, cb, params) {

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


  UI.button = function(cb, params) {

    if((typeof params == "function") && (typeof cb == "object")) {
      var temp = params;
      params = cb;
      cb = temp;
    }

    params = params || {};

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
    button.onclick = cb;
    params.parent.appendChild(button);
  };


  UI.input = function(params) {

    params = params || {};

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
    input.placeholder = params.placeholder || "";
    input.className = (params.class !== undefined) ? params.class : ((params.className !== undefined) ? params.className : "form-control input-lg");
    if(params.style) {
      for (var key in params.style) {
        var val = params.style[key];
        input.style[key] = val;
      }
    }
    input.style.width = input.style.width || params.width || "450px";
    input.style.marginTop = input.style.marginTop || params.marginTop || "5px";
    input.style.marginBottom = input.style.marginBottom || params.marginBottom || "5px";
    input.value = params.value || localStorage[params.id] || "";

    input.onkeyup = saveContents;
    input.onchange = saveContents;

    function saveContents() {
      localStorage[params.id] = input.value.trim();
    }

    params.parent.appendChild(input);
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