/**
 * Generate a random alphanumeric string no longer than 5 characters
 */
var randomString = function() {
	return (Math.ceil(Math.random()*Math.pow(36,5))).toString(36);
};

window.BP = window.BP || {};

BP.each = function(list, fn, context) {
	var i, key, length;
	
	if (list == null) { return; }

    if (list.length === +list.length) {
		for (i = 0, length = list.length; i < length; i++) {
			fn.call(context, list[i], i, list);
		}
	} else {
		for(key in list) {
			if(list.hasOwnProperty(key)) {
				fn.call(context, list[key], key, list);
			}
		}
	}
};

BP.extend =  function(obj) {
	var sources = Array.prototype.slice.call(arguments,1);

	BP.each(sources, function(source) {
		BP.each(source, function(propVal, prop) {
			obj[prop] = propVal;
		});
	});

	return obj;
};

/**
 * Simple template function
 */
BP.template = (function(){
	var d = '{{',
		a = '}}',
		e = '[a-z0-9_][\\.a-z0-9_]*',
		c = new RegExp(d+'('+e+')'+a,'gim'),
		b;

	return function(f,g) {
		return f.replace(c,function(j,l) {
			var n = l.split('.'),
				h = n.length,
				m = g,
				k = 0;

			for(;k < h;k++){
				if(m === b || m === null) { break; }
				m = m[n[k]];
				if(k === h - 1) { return m; }
			}
		});
	};
}());


/**
 * custom localStorage object that sets BitPoint-specific data
 *
 * set: if value is not a string, attempt to stringify it, then save it
 * get: if value fetched is able to be parsed into an object, do it
 */
BP.localStorage = {
	set: function(key,value) {
		if(typeof value !== 'string') {
			try {
				value = JSON.stringify(value);
			} catch(e) {
				// nothing to do here
			}
		}
		window.localStorage.setItem('bitpoints-'+key,value);
	},
	get: function(key) {
		var item = window.localStorage.getItem('bitpoints-'+key);

		try {
			item = JSON.parse(item);
		} catch(e) {
			// nothing to do here
		} finally {
			return item;
		}
	}
};

/**
 * A modal class of our very own. Super-simple, no-frills
 * @param  options  an object storing the following properties:
 *   - id: unique identifier for this modal (we allow multiple modals on the page)
 *   - size: 'small|large', determines width, padding, font-size
 *   - content: html to be dropped into the modal's content area
 */
BP.Modal = function(options) {
	var self = this;

	this.defaults = {
		id: randomString(),
		size: 'medium'
	};

	BP.extend(this, this.defaults, options);

	var cover = $('#'+this.id+'-modal-cover.bp-modal-cover'),
		modal = $('#'+this.id+'-modal-container.bp-modal-container'),
		modalContent, modalClose;

	if(cover.length === 0) {
		cover = $('<div id="'+this.id+'-modal-cover" class="bp-modal-cover"/>').appendTo('body');
	}
	if(modal.length === 0) {
		modal = $('<div id="'+this.id+'-modal-container" class="bp-modal-container bp-modal-'+this.size+'"><div class="bp-modal-close">&times;</div><div class="bp-modal-content"/></div>').appendTo('body');
	}

	modalContent = modal.find('.bp-modal-content');
	modalClose = modal.find('.bp-modal-close');

	modalClose.off().on('click',function() {
		self.hide();
	});
	
	modalContent.html(this.content);

	this.show = function() {
		cover.addClass('visible');
		modal.addClass('visible');
	};
	this.hide = function() {
		cover.removeClass('visible');
		modal.removeClass('visible');
	};
	this.toggle = function() {
		cover.toggleClass('visible');
		modal.toggleClass('visible');
	};
};

/**
 * An encapsulation of the events and functionality necessary for a page
 * within our app
 * 
 * setupSocketEvents: bind provided methods to the associated socket events
 * setupDomEvents: bind provided methods to the associated dom events on the specified elements
 *
 * Expected 'options' properties:
 *
 * socketEvents: map of socket event names to method names
 * domEvents: map of dom event-type/target-elements to method names
 * socket: socket object to use for binding socket events
 * domRoot: selector used to attach dom event handlers to
 * initialize: method to run after all event handlers have been attached
 */
BP.Page = function(options) {

	this.defaults = {
		domRoot: 'body'
	};

	// Attach event maps, initialize method, and any other properties to the page
	BP.extend(this, this.defaults, options);

	var $domRoot = $(this.domRoot);
	
	/**
	 * Convenience $ call that limits results to children of the dom root for the page
	 */
	this.$ = function(selector) {
		return $domRoot.find(selector);
	};

	var setupSocketEvents = function() {
		var self = this,
			handleSocketEvent = function(fn) {
				return function(data) {
					fn.call(self,data);
				};
			};

		if(this.socket) {
			BP.each(this.socketEvents, function(handler, eventName) {
				self.socket.on(eventName,handleSocketEvent(self[handler]));
			});
		}
	};

	// BP.Page DOM event handlers should be called in the context of the Page instance
	// As a result, handlers will receive two arguments:
	//   - e : event object
	//   - $el : jQuery wrapped event target
	var setupDomEvents = function() {
		var self = this,
			handleDomEvent = function(fn) {
				return function(e) {
					fn.call(self, e, $(this));
				};
			};

		BP.each(this.domEvents, function(handler, e) {
			var eArr = e.split(' '),
				eName = eArr[0],
				eTarget = eArr[1];

			$domRoot.on(eName+'.bp',eTarget,handleDomEvent(self[handler]));
		});
	};

	/**
	 * Allow the user to define a list of elements they would like to have available on the page
	 */
	var setupDomElements = function(obj) {
		var self = this;
		BP.each(obj, function(selector, varName) {
			self['$'+varName] = self.$(selector);
		});
	};

	/**
	 * Add additional DOM elements to the page. Accepts a single map or two strings: a variable name and a selector
	 */
	this.addDOM = function() {
		if(arguments.length === 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'string') {
			this['$'+arguments[0]] = this.$(arguments[1]);
		} else if(typeof arguments[0] === 'object') {
			setupDomElements.call(this,arguments[0]);
		}
	};

	this.init = function() {
		var self = this;

		setupSocketEvents.call(this);

		$(function(){
			setupDomEvents.call(self);
			setupDomElements.call(self, self.DOM);

			if(typeof self.initialize === 'function') {
				self.initialize.call(self);
			}
		});
	};
};