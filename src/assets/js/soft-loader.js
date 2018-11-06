/**
 * Loads content locally and replaces the state of the browser, requires HTML5 
 * or a Poly-fill for History API.
 */
var SoftLoader = {
    target: null,
    /**
     * Initiates the SoftLoader and binds it to a HTML element.
     * 
     * @param  {string|HTMLElement}  selector  A HTML element or CSS selector.
     */
    bind: function(selector){
        if(selector instanceof HTMLElement)
            this.target = selector;
        else
            this.target = document.querySelector(selector);
        var _this = this;
        history.replaceState({
            title: document.title,
            content: this.target.innerHTML,
        }, document.title);
        window.onpopstate = function(e) {
            if (e.state) {
                document.title = e.state.title;
                _this.target.innerHTML = e.state.content;
            }
        };
    },
    /**
     * Replaces the content of the SoftLoader and the browser's state.
     * 
     * @param  {string}  content  The HTML content.
     * @param  {string}  title  A document title replaces the original one.
     * @param  {string}  url  A document URL that replaces the original one.
     */
    replaceWith: function(content, title, url){
        title = title || document.title;
        history.pushState({
            title: title,
            content: content,
        }, title, url);
        document.title = title;
        this.target.innerHTML = content;
    },

    replaceLink: function (url) {
        history.pushState({
            title: document.title,
            content: this.target.innerHTML
        }, document.title, url);
    }
};

if (typeof window == 'object') {
    window.SoftLoader = SoftLoader;
    if (typeof define === 'function') {
        //AMD
        define((require, exports, module) => {
            module.exports = SoftLoader;
        });
    }
} else if (typeof module === 'object' && module.exports) {
    //CommonJS
    module.exports = SoftLoader;
}