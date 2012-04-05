/*!
 * Open source under the BSD License
 * Copyright (c) 2011, Philippe Le Van, Kitpages, http://www.kitpages.fr
 */
(function( $ ){
    
    var WidgetSlideshow = (function() {
        // constructor
        function WidgetSlideshow(boundingBox, options) {
            this._settings = {
                // durations
                moveDelay: 50, // time in ms between moves
                // speed
                animationSpeed: 300, // duration of the animation in ms
                animationType: "fade",
                // size
                wrapperMaxWidth: 10000,
                wrapperMaxHeight: 10000,
                animationStepWidth: "auto", //step in px of the animation
                // keys
                keyCodeLeftArrow: 37, // from http://www.javascripter.net/faq/keycodes.htm
                keyCodeRightArrow: 39,
                // events
                render: null, // after rendering of dom
                animation: null, // before animation begining
                stop: null // before stop of animation
            };
            // settings
            if (options) {
                $.extend(this._settings, options);
            }

            // DOM Nodes
            this._boundingBox = boundingBox;

            // memory
            this._boundingBox.data( "kitSlideshow", this );

            this.init();
        };
        
        // methods
        WidgetSlideshow.prototype = {
            init: function() {
                var self = this;
                var eventList = ['render', 'animation', 'stop'];
                // init custom events according to settings callback values
                for (var i = 0 ; i < eventList.length ; i++ ) {
                    if (this._settings[eventList[i]]) {
                        this._boundingBox.bind(eventList[i]+"_kitSlideshow", {self:self}, this._settings[eventList[i]]);
                    }
                }
                // init custom events according to settings callback values
                for (var i = 0 ; i < eventList.length ; i++ ) {
                    var callbackName = "_"+eventList[i]+"Callback";
                    this._boundingBox.bind(eventList[i]+"_kitSlideshow", {self:self}, this[callbackName]);
                }
                var self = this;
                self._isDocumentReadyRendered = false;
                self._isWindowLoadRendered = false;
                $(document).ready(function() {
                    self.render();
                });
            },

            ////
            // callbacks
            ////
            _renderCallback: function(event) {
                if (event.isDefaultPrevented()) {
                    return;
                }

                var self = event.data.self;
                self._render();
            },
            _animationCallback: function(event, direction) {
                if (event.isDefaultPrevented()) {
                    return;
                }

                var self = event.data.self;
                self._animation(direction);
            },
            _stopCallback: function(event) {
                if (event.isDefaultPrevented()) {
                    return;
                }

                var self = event.data.self;
                self._stop();
            },

            ////
            // real methods that do something
            ////
            _render: function() {
                var self = this;
                if (self._isDocumentReadyRendered == true) {
                    return;
                }
                self._isDocumentReadyRendered = true;
                var html = self._boundingBox.html();
                self._boundingBox.css({
                    'overflow':'hidden',
                    'position': 'relative'
                });
                self._boundingBox.empty().append(
                    '<div class="kit-slideshow-wrapper">'+
                    '<div class="kit-slideshow-container">'+html+'</div>'+
                    '</div>'+
                    '<div class="kit-slideshow-button-left"></div>'+
                    '<div class="kit-slideshow-button-right"></div>'
                );
                self._boundingBox.find('.kit-slideshow-wrapper').css({
                    'position': 'relative',
                    'width': self._settings.wrapperMaxWidth+'px',
                    'height': self._settings.wrapperMaxHeight+'px'
                });
                self._boundingBox.find('.kit-slideshow-container').css({
                    'position': 'absolute',
                    'top': '0px',
                    'left': '0px'
                });
                self._buttonLeft = self._boundingBox.find('.kit-slideshow-button-left');
                self._buttonRight = self._boundingBox.find('.kit-slideshow-button-right');
                self._container = self._boundingBox.find('.kit-slideshow-container');
                self._wrapper = self._boundingBox.find('.kit-slideshow-wrapper');
                self._buttonLeft.hide();
                self._buttonRight.hide();

                $(window).load(function() {
                    if (self._isWindowLoadRendered == true) {
                        return;
                    }
                    self._isWindowLoadRendered = true;
                    if (self._settings.animationStepWidth == "auto") {
                        self._settings.animationStepWidth = self._boundingBox.width();
                    }
                    self._boundingBox.height(self._container.height());
                    self._buttonLeft.show();
                    self._buttonRight.show();
                    self._buttonLeft.css({
                        'top': ((self._container.height()-self._buttonLeft.height()) / 2)+'px'
                    });
                    self._buttonRight.css({
                        'top': ((self._container.height()-self._buttonRight.height()) / 2)+'px'
                    });


                    self._renderButton();
                    self._buttonRight.click(function(e) {
                        self._boundingBox.trigger("animation_kitSlideshow", ["right"]);
                    });
                    self._buttonLeft.click(function(e) {
                        self._boundingBox.trigger("animation_kitSlideshow", ["left"]);
                    });
                });
            },

            _renderButton: function() {
                var self = this;
                if (self._container.position().left < 0) {
                    self._buttonLeft.show();
                } else {
                    self._buttonLeft.hide();
                }

                if (self._container.position().left  > self._boundingBox.width() - self._container.width() ) {
                    self._buttonRight.show();
                } else {
                    self._buttonRight.hide();
                }
            },

            _animation: function(direction) {
                var self = this;
                var newLeft = null;
                if (direction=="right") {
                    newLeft = self._container.position().left - self._settings.animationStepWidth;
                    if (newLeft < self._boundingBox.width() - self._container.width() ) {
                        newLeft = self._boundingBox.width() - self._container.width();
                    }
                }
                if (direction=="left") {
                    newLeft = self._container.position().left + self._settings.animationStepWidth;
                    if (newLeft > 0 ) {
                        newLeft = 0;
                    }
                }
                if (newLeft != self._container.position().left) {
                    self._container.animate(
                        {
                            'left': newLeft,
                            callback:function () { self._renderButton(); }
                        },
                        self._settings.animationSpeed,
                        function () { self._container.css("left", newLeft+"px");self._renderButton(); }
                    );
                }
                self._renderButton();

            },

            _stop: function() {
                var self = this;
                self._moveState.isMoving = false;
                self._moveState.currentSpeed = 1;
                clearTimeout(self.moveTimer);
            },

            ////
            // external methods
            ////
            render: function() {
                var self = this;
                self._boundingBox.trigger("render_kitSlideshow");
            }
        };
        return WidgetSlideshow;
    })();
    
    var methods = {
        /**
         * add events to a dl instance
         * @this the dl instance (jquery object)
         */
        init : function ( options ) {
            var self = $(this);
            // chainability => foreach
            return this.each(function() {
                var widget = new WidgetSlideshow($(this), options);
            });
        },

        render: function() {
            return this.each(function() {
                var widget = $(this).data("kitSlideshow");
                widget.render();
            });
        },
        /**
         * unbind all kitSlideshow events
         */
        destroy : function( ) {
        }
        
    };
    
    $.fn.kitSlideshow = function( method ) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.kitSlideshow' );
        }
    };
})( jQuery );