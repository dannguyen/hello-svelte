
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Cage.svelte generated by Svelte v3.14.1 */

    const file = "src/Cage.svelte";

    function create_fragment(ctx) {
    	let div;
    	let span;
    	let a;
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			a = element("a");
    			t0 = text(ctx.imgUrl);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			img = element("img");
    			attr_dev(a, "href", ctx.imgUrl);
    			add_location(a, file, 14, 7, 222);
    			attr_dev(span, "class", "caption");
    			add_location(span, file, 13, 4, 192);
    			add_location(br, file, 16, 4, 270);
    			if (img.src !== (img_src_value = ctx.imgUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", ctx.imgUrl);
    			add_location(img, file, 17, 4, 279);
    			attr_dev(div, "class", "cage svelte-k6ezrd");
    			add_location(div, file, 12, 0, 169);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, a);
    			append_dev(a, t0);
    			append_dev(div, t1);
    			append_dev(div, br);
    			append_dev(div, t2);
    			append_dev(div, img);
    		},
    		p: function update(changed, ctx) {
    			if (changed.imgUrl) set_data_dev(t0, ctx.imgUrl);

    			if (changed.imgUrl) {
    				attr_dev(a, "href", ctx.imgUrl);
    			}

    			if (changed.imgUrl && img.src !== (img_src_value = ctx.imgUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (changed.imgUrl) {
    				attr_dev(img, "alt", ctx.imgUrl);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const defaultImage = "./assets/cat.jpg";

    function instance($$self, $$props, $$invalidate) {
    	let { imgUrl = defaultImage } = $$props;
    	const writable_props = ["imgUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cage> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("imgUrl" in $$props) $$invalidate("imgUrl", imgUrl = $$props.imgUrl);
    	};

    	$$self.$capture_state = () => {
    		return { imgUrl };
    	};

    	$$self.$inject_state = $$props => {
    		if ("imgUrl" in $$props) $$invalidate("imgUrl", imgUrl = $$props.imgUrl);
    	};

    	return { imgUrl };
    }

    class Cage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { imgUrl: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cage",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get imgUrl() {
    		throw new Error("<Cage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgUrl(value) {
    		throw new Error("<Cage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Loader.svelte generated by Svelte v3.14.1 */

    const { console: console_1 } = globals;
    const file$1 = "src/Loader.svelte";

    function create_fragment$1(ctx) {
    	let section1;
    	let div;
    	let button0;
    	let t1;
    	let br;
    	let t2;
    	let button1;
    	let t3;
    	let t4;
    	let label0;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let t9;
    	let input1;
    	let t10;
    	let section0;
    	let dispose;

    	const block = {
    		c: function create() {
    			section1 = element("section");
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Random!";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			button1 = element("button");
    			t3 = text(ctx.btnLabel);
    			t4 = space();
    			label0 = element("label");
    			label0.textContent = "Width:";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Height";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			section0 = element("section");
    			attr_dev(button0, "class", "mybutton svelte-8b74i6");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$1, 90, 16, 2122);
    			add_location(br, file$1, 93, 8, 2245);
    			attr_dev(button1, "class", "mybutton svelte-8b74i6");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$1, 95, 12, 2263);
    			attr_dev(label0, "for", "cageWidth");
    			attr_dev(label0, "class", "svelte-8b74i6");
    			add_location(label0, file$1, 98, 12, 2387);
    			attr_dev(input0, "size", "4");
    			attr_dev(input0, "name", "cageWidth");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-8b74i6");
    			add_location(input0, file$1, 99, 12, 2437);
    			attr_dev(label1, "for", "cageHeight");
    			attr_dev(label1, "class", "svelte-8b74i6");
    			add_location(label1, file$1, 101, 12, 2517);
    			attr_dev(input1, "size", "4");
    			attr_dev(input1, "name", "cageHeight");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-8b74i6");
    			add_location(input1, file$1, 102, 12, 2568);
    			attr_dev(div, "class", "buttons svelte-8b74i6");
    			add_location(div, file$1, 89, 8, 2084);
    			attr_dev(section0, "id", "cageCage");
    			attr_dev(section0, "class", "svelte-8b74i6");
    			add_location(section0, file$1, 105, 4, 2657);
    			attr_dev(section1, "class", "cage-panel");
    			add_location(section1, file$1, 87, 0, 2046);

    			dispose = [
    				listen_dev(button0, "click", ctx.randoCage, false, false, false),
    				listen_dev(button1, "click", ctx.handleClick, false, false, false),
    				listen_dev(input0, "input", ctx.input0_input_handler),
    				listen_dev(input1, "input", ctx.input1_input_handler)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section1, anchor);
    			append_dev(section1, div);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, br);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, t3);
    			append_dev(div, t4);
    			append_dev(div, label0);
    			append_dev(div, t6);
    			append_dev(div, input0);
    			set_input_value(input0, ctx.cageWidth);
    			append_dev(div, t7);
    			append_dev(div, label1);
    			append_dev(div, t9);
    			append_dev(div, input1);
    			set_input_value(input1, ctx.cageHeight);
    			append_dev(section1, t10);
    			append_dev(section1, section0);
    		},
    		p: function update(changed, ctx) {
    			if (changed.btnLabel) set_data_dev(t3, ctx.btnLabel);

    			if (changed.cageWidth && input0.value !== ctx.cageWidth) {
    				set_input_value(input0, ctx.cageWidth);
    			}

    			if (changed.cageHeight && input1.value !== ctx.cageHeight) {
    				set_input_value(input1, ctx.cageHeight);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const defaultSrcUrl = "https://www.placecage.com";

    function instance$1($$self, $$props, $$invalidate) {
    	const CAGETYPES = ["g", "c", "gif"];
    	let { cageWidth = 600 } = $$props;
    	let { cageHeight = 400 } = $$props;
    	let { cageType = "" } = $$props;

    	function handleClick() {
    		loadCage(cageWidth, cageHeight);
    	}

    	function loadCage(width = cageWidth, height = cageHeight, imgtype = cageType) {
    		let url = defaultSrcUrl;

    		if (CAGETYPES.includes(imgtype)) {
    			url = `${url}/${imgtype}`;
    		}

    		url = `${url}/${width}/${height}`;

    		{
    			console.log("Loader doing it! " + url);

    			let cage = new Cage({
    					target: document.getElementById("cageCage"),
    					props: { imgUrl: url }
    				});
    		}
    	}

    	function randoCage() {
    		let w = Math.round(200 + Math.random() * 800);
    		let h = Math.round(0.25 * w + Math.random() * 600);
    		let t = "normal";

    		if (Math.random() > 0.4) {
    			t = CAGETYPES[Math.floor(Math.random() * CAGETYPES.length)];
    		}

    		loadCage(w, h, t);
    	}

    	const writable_props = ["cageWidth", "cageHeight", "cageType"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Loader> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		cageWidth = this.value;
    		$$invalidate("cageWidth", cageWidth);
    	}

    	function input1_input_handler() {
    		cageHeight = this.value;
    		$$invalidate("cageHeight", cageHeight);
    	}

    	$$self.$set = $$props => {
    		if ("cageWidth" in $$props) $$invalidate("cageWidth", cageWidth = $$props.cageWidth);
    		if ("cageHeight" in $$props) $$invalidate("cageHeight", cageHeight = $$props.cageHeight);
    		if ("cageType" in $$props) $$invalidate("cageType", cageType = $$props.cageType);
    	};

    	$$self.$capture_state = () => {
    		return {
    			cageWidth,
    			cageHeight,
    			cageType,
    			btnLabel
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("cageWidth" in $$props) $$invalidate("cageWidth", cageWidth = $$props.cageWidth);
    		if ("cageHeight" in $$props) $$invalidate("cageHeight", cageHeight = $$props.cageHeight);
    		if ("cageType" in $$props) $$invalidate("cageType", cageType = $$props.cageType);
    		if ("btnLabel" in $$props) $$invalidate("btnLabel", btnLabel = $$props.btnLabel);
    	};

    	let btnLabel;

    	$$self.$$.update = (changed = { cageWidth: 1, cageHeight: 1 }) => {
    		if (changed.cageWidth || changed.cageHeight) {
    			 $$invalidate("btnLabel", btnLabel = `Load: ${cageWidth}x${cageHeight} cage!`);
    		}
    	};

    	return {
    		cageWidth,
    		cageHeight,
    		cageType,
    		handleClick,
    		randoCage,
    		btnLabel,
    		input0_input_handler,
    		input1_input_handler
    	};
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { cageWidth: 0, cageHeight: 0, cageType: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loader",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get cageWidth() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cageWidth(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cageHeight() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cageHeight(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cageType() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cageType(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.14.1 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let h1;
    	let t3;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = `Hello ${name}, welcome to CageLoader!`;
    			t3 = space();
    			create_component(loader.$$.fragment);
    			attr_dev(h1, "class", "svelte-1yia1dp");
    			add_location(h1, file$2, 20, 4, 241);
    			add_location(header, file$2, 19, 0, 228);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			insert_dev(target, t3, anchor);
    			mount_component(loader, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t3);
    			destroy_component(loader, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let name = "World";

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'poo'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
