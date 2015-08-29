module.exports = {
	ValidationError: function(message, errors) {
		return Error(message, errors);
	}
};
