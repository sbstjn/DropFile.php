function safe_tags_replace(str) {
  /** @see http://stackoverflow.com/a/5499821 **/
  var tagsToReplace = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};
  return str.replace(/[&<>]/g, function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
  });
}

var Uploader = function(data) {
  this.options = data;
  this.list = {};
  this.zone = document.getElementById(this.options.zone);
  this.result = document.getElementById(this.options.result);
  this.template = [
    '<li data-id="{id}" data-url="" data-name="{labelname}">',
    '<span class="filename">{localname}</span>',
    '<span class="size">{size} kb</span>',
    '<ul class="options">',
    '<li><a href="#" class="option active" data-type="url">URL</a></li>',
    '<li><a href="#" class="option" data-type="markdown">Markdown</a></li>',
    '<li><a href="#" class="option" data-type="html">HTML</a></li>',
    '</ul><div class="response">',
    '<div class="progress" style="width: 10%;"></div>',
    '</div></div></li>'
  ].join('');
  
  this.formater = {
    'url': '{url}',
    'markdown': '[{name}]({url})',
    'html': '<a href="{url}">{name}</a>'
  };
  
  this.init();
};

Uploader.prototype.init = function() {
  this.zone.addEventListener('dragover', this.handleDrag.bind(this), false);
  this.zone.addEventListener('drop', this.handleDrop.bind(this), false);
  
  this.result.addEventListener('click', this.handleSwitch.bind(this));
};

Uploader.prototype.handleSwitch = function(e) {
  if (e.toElement.nodeName == 'A') {
    this.handleSwitch(e);
  }
};

Uploader.prototype.switchDisplay = function(id, type, url) {
  var query = 'li[data-id="' + id + '"]';
  var value = safe_tags_replace(this.formater[type]
    .replace('{url}', url)
    .replace('{name}', this.result.querySelector(query).getAttribute('data-name')));
  
  var options = this.result.querySelectorAll(query + ' .option');
  for (var i = 0, m = options.length; i < m; i++) {
    options[i].className = 'option';
  }
  
  this.result.querySelector(query + ' .option[data-type="' + type + '"]').className = 'option active';
  this.result.querySelector(query + ' pre').innerHTML = value;
}

Uploader.prototype.handleSwitch = function(e) {
  e.stopPropagation();
  e.preventDefault();
  
  var id = e.path[3].getAttribute('data-id');
  var type = e.srcElement.getAttribute('data-type');
  var url = e.path[3].getAttribute('data-url');
  
  this.switchDisplay(id, type, url);
};

Uploader.prototype.handleDrag = function(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move'; 
};

Uploader.prototype.handleDrop = function(e) {
  e.stopPropagation();
  e.preventDefault();
  
  this.preview(e);
};

Uploader.prototype.preview = function(e) {
  var files = e.dataTransfer.files;
  var output = [];
  
  for (var i = 0, f; f = files[i]; i++) {
    f.id = (Math.random().toString(36)+'00000000000000000').slice(2, 8);;
    this.list[f.id] = f;
    
    output.push((this.template + '')
      .replace('{localname}', escape(f.name))
      .replace('{labelname}', escape(f.name))
      .replace('{size}', (Math.round(f.size*100/1024)/100))
      .replace('{id}', f.id));
  }

  this.result.innerHTML += output.join('');
  this.upload();
};

Uploader.prototype.upload = function() {
  for (var n in this.list) {
    this.uploadFile(this.list[n]);
  }
};

Uploader.prototype.uploadProgress = function(e, i) {
  var percent = Math.round(e.loaded * 100 / e.total);
  var element = this.result.querySelector('li[data-id="' + i + '"] .progress');
  
  if (element) {
    element.style.width = percent + '%';
  }
};

Uploader.prototype.uploadFinish = function(e, i) {
  var body = JSON.parse(e.srcElement.responseText);
  var query = 'li[data-id="' + i + '"]';
  var progress = this.result.querySelector(query + ' .progress');
  
  if (progress) {
    progress.className = 'progress done';
    setTimeout(function() {
      var url = this.options.baseurl + body.file;
      var data = '<div class="url"><pre>' + url + '</pre></div>';
      this.result.querySelector(query + ' .options').className = 'options show';
      this.result.querySelector(query).setAttribute('data-url', url);
      this.result.querySelector(query + ' .response').innerHTML = data;
    }.bind(this), 200);
  }
};

Uploader.prototype.uploadFile = function(file) {
  var xhr = new XMLHttpRequest();
  var fd = new FormData();
  
  fd.append('file', file);
  
  xhr.upload.addEventListener("progress", function(e) {
    this.uploadProgress(e, file.id);
  }.bind(this), false);
  
  xhr.addEventListener("load", function(e) { 
    this.uploadFinish(e, file.id);
  }.bind(this), false);
  
  xhr.open("POST", this.options.upload);
  xhr.send(fd);
};