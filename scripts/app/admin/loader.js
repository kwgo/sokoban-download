(function (x) {
    x.addScript = function (url) {
        document.write('<script type="text/javascript" src="' + url + '"></' + 'script>');
    };
})(jQuery);

/* ADMIN JAVASCRIPT */
$.addScript('scripts/app/admin/module.js');
