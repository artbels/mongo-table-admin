/**
 * User interface elements
 * @ artbels
 * artbels@gmail.com
 * 2016
 * ver 1.1.1 *
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


})();