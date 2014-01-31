window.bp = window.bp || {};

bp.setLocalItem = function(key,value) {
	if(typeof value !== 'string') {
		try {
			value = JSON.stringify(value);
		} catch(e) {
			// nothing to do here
		}
	}
	window.localStorage.setItem('bitpoints-'+key,value);
};

bp.getLocalItem = function(key) {
	var item = window.localStorage.getItem('bitpoints-'+key);

	try {
		item = JSON.parse(item);
	} catch(e) {
		// nothing to do here
	} finally {
		return item;
	}
};

bp.getLocalUserData = function() {
	return bp.getLocalItem('user-data');
};

bp.showModal = function(content) {
	var cover = $('.bp-modal-cover').hide(),
		modal = $('.bp-modal-container').hide(),
		modalContent;

	if(cover.length === 0) {
		cover = $('<div class="bp-modal-cover"/>').appendTo('body');
	}
	if(modal.length === 0) {
		modal = $('<div class="bp-modal-container"><div class="bp-modal-close">&times;</div><div class="bp-modal-content"/></div>').appendTo('body');
	}

	modalContent = modal.find('.bp-modal-content');
	modalClose = modal.find('.bp-modal-close');

	modalClose.off().on('click',function() {
		modal.hide();
		cover.hide();
	});
	
	modalContent.html(content);

	cover.show();
	modal.show();
};