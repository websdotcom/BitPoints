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

	this.defaults = {
		id: randomString(),
		size: 'medium'
	};

	BP.extend(this, this.defaults, options);

	var cover = $('#'+this.id+'-modal-cover.bp-modal-cover').hide(),
		modal = $('#'+this.id+'-modal-container.bp-modal-container').hide(),
		modalContent, modalClose;

	if(cover.length === 0) {
		cover = $('<div id="'+this.id+'-modal-cover" class="bp-modal-cover"/>').appendTo('body');
	}
	if(modal.length === 0) {
		modal = $('<div id="'+this.id+'-modal-cover" class="bp-modal-container bp-modal-'+this.size+'"><div class="bp-modal-close">&times;</div><div class="bp-modal-content"/></div>').appendTo('body');
	}

	modalContent = modal.find('.bp-modal-content');
	modalClose = modal.find('.bp-modal-close');

	modalClose.off().on('click',function() {
		modal.hide();
		cover.hide();
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
		cover.removeClass('visible');
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
					fn.call(self,e, $(this));
				};
			};

		BP.each(this.domEvents, function(handler, e) {
			var eArr = e.split(' '),
				eName = eArr[0],
				eTarget = eArr[1];

			$(self.domRoot).on(eName+'.bp',eTarget,handleDomEvent(self[handler]));
		});
	};

	this.init = function() {
		var self = this;

		setupSocketEvents.call(this);

		$(function(){
			setupDomEvents.call(self);

			if(typeof self.initialize === 'function') {
				self.initialize.call(self);
			}
		});
	};
};