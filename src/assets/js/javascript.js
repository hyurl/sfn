/// <reference types="jquery"/>
"use strict";

var QueryString = {
    /**
     * Parses URL query string.
     * @param {string} query
     * @returns {object}
     */
    parse: function parse(query) {
        if (query[0] == "?") query = query.slice(1);
        var pairs = query.split("&"),
            obj = {};

        for (var i in pairs) {
            var pair = pairs[i].split("="),
                key = decodeURIComponent(pair[0]),
                value = pair[1] ? decodeURIComponent(pair[1]) : "";

            obj[key] = value;
        }

        return obj;
    },

    /**
     * Stringifies an object to a URL query string.
     * @param {object} obj 
     * @returns {string}
     */
    stringify: function stringify(obj) {
        var arr = [];
        for (var x in obj) {
            arr.push(encodeURIComponent(x) + "=" + encodeURIComponent(obj[x]));
        }
        return arr.join("&");
    },

    setUrl: function setUrl(url, obj) {
        var i = url.indexOf("?"),
            j = url.indexOf("#");

        j = j !== -1 ? j : url.length;
        i = i !== -1 ? i : j;

        return url.slice(0, i) + "?" + QueryString.stringify(obj) + url.slice(j);
    }
};

$.fn.typeIn = function (speed, placeholder, callback) {
    speed = speed || 100;
    switch (speed) {
        case "slow":
            speed = 150;
            break;
        case "normal":
            speed = 100;
            break;
        case "fast":
            speed = 50;
            break;
    }
    placeholder = placeholder || '_';
    if (typeof placeholder == 'function') {
        callback = placeholder;
        placeholder = '_';
    }
    var $this = $(this),
        html = $this.html().trim(),
        i = 0;
    $(this).html('');
    $(this).each(function () {
        var int = setInterval(function () {
            if (html.substr(i, 1) == '<') {
                i = html.indexOf('>', i) + 1;
            } else {
                i++;
            }
            $this.html(html.substring(0, i) + (i & 1 ? placeholder : ''));
            if (i >= html.length) {
                clearInterval(int);
                if (typeof callback == 'function') {
                    callback.call($this, $this);
                }
            }
        }, speed);
    });
    return this;
};

$(function () {
    var lang = QueryString.parse(location.search).lang || navigator.language,
        navbar = $(".navbar>ul"),
        sidebar = $(".sidebar"),
        content = $("article.content"),
        navbarToggle = $(".navbar-toggle");

    function scrollPage(id) {
        var target = id || location.hash ? $(id || decodeURIComponent(location.hash))[0] : null,
            navbarHeight = $("header")[0].offsetHeight + 20;
        // Scroll the body.
        $("html,body").animate({
            scrollTop: target ? target.offsetTop - navbarHeight : 0
        });
    }

    function highlightMenu(href) {
        sidebar.find("a").each(function () {
            var $this = $(this),
                _href = $this.attr("href");

            if (_href == href) {
                $this.addClass("active");
                expandMenu($this);
            } else {
                $this.removeClass("active");
            }
        });
    }

    function expandMenu($this) {
        var parent = $this.prop("tagName") != "UL" ? $this.closest("ul") : $this.parent().closest("ul");

        if (parent.length && parent.css("display") == "none") {
            parent.prev(".section-title").find("i").removeClass("fa-angle-right").addClass("fa-angle-down");
            parent.slideDown();
        }

        if (parent.length) expandMenu(parent);
    }

    /** Add ?lang=[lang] in the URL **/
    function replaceLink(target) {
        var lang = QueryString.parse(location.search).lang;
        if (lang) {
            target = target || $("body");
            target.find("a").each(function () {
                var href = $(this).attr("href"),
                    query = QueryString.parse(href);

                if (href.indexOf("javascript:") !== 0
                    && href.indexOf("http") !== 0
                    && href.indexOf("#") !== 0
                    && !query.lang) {

                    href = QueryString.setUrl(href, { lang: lang });

                    $(this).attr("href", href);
                }
            })
        }
    };

    navbarToggle.click(function () {
        navbar.parent().slideToggle();
    });

    // Highlight navbar tab.
    navbar.children().each(function () {
        var $this = $(this),
            link = $this.children("a").attr("href"),
            i = location.pathname.lastIndexOf("/") + 1,
            cat = i ? location.pathname.substr(0, i) : location.pathname;
        link == cat ? $this.addClass("active") : $this.removeClass("active");
    });

    // Handle anchor clicking.
    $(document).on("click", "a", function (e) {
        var link = $(this).attr("href");
        if (link[0] == "#") {
            e.preventDefault();
            SoftLoader.replaceLink(link);
            scrollPage(link);
            highlightMenu(decodeURIComponent(location.href.slice(location.origin.length)));
        }
    });

    //Show ICP in china area.
    if (lang == 'zh-CN') {
        $("#icp").show();
    }

    var command = $(".command>pre"),
        type = function () {
            command.typeIn("slow", function () {
                setTimeout(type, 1500);
            });
        };

    if (command.length)
        setTimeout(type, 1500);

    if (content.length) {
        var Title = document.title;

        SoftLoader.bind(content[0]);

        sidebar.find("a").click(function (e) {
            e.preventDefault();

            var href = $(this).attr("href"),
                i = href.indexOf("?");
            i = i === -1 ? href.indexOf("#") : i;
            var pathname = href.slice(0, i === -1 ? href.length : i),
                hash = href.slice(href.indexOf("#")),
                text = $(this).text(),
                title = Title.replace(/:\s([\S\s]+)\s\|/, function (match) {
                    return ": " + text + " |";
                });

            if (href.indexOf("javascript:") !== 0) {
                highlightMenu($(this).attr("href"));

                if (location.pathname != pathname) {
                    content.removeClass("fadeIn").addClass("fadeOut");

                    $.get(href, function (data) {
                        content.removeClass("fadeOut").addClass("fadeIn");
                        SoftLoader.replaceWith(data, title, href);
                        replaceLink(content);
                        scrollPage(hash);
                    });
                } else {
                    SoftLoader.replaceLink(href);
                    scrollPage(hash);
                }
            }
        });

        // 展开关闭侧边栏菜单项
        sidebar.find('i').click(function (e) {
            var $this = $(this);

            if ($this.hasClass("fa-angle-right")) {
                $this.removeClass("fa-angle-right").addClass("fa-angle-down");
            } else {
                $this.removeClass("fa-angle-down").addClass("fa-angle-right");
            }

            $this.closest("div").next(".section-children").slideToggle();
        });
    }

    replaceLink();
    highlightMenu(decodeURIComponent(location.href.slice(location.origin.length)));
    scrollPage();

    // 滚动监听
    // var $window = $(window),
    //     $footer = $("footer"),
    //     windowHeight = $window.height(),
    //     footerHiefght = $footer.height(),
    //     footerTop = $footer.offset().top;

    // $window.scroll(function (event) {
    //     var scrollTop = $window.scrollTop();

    //     console.log(scrollTop + windowHeight, footerTop);
    //     if (scrollTop + windowHeight >= footerTop) {
    //         sidebar.css("buttom", "118px");
    //     } else {
    //         sidebar.css("buttom", "20px");
    //     }
    // });
});