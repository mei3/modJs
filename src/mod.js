(function(global) {
	var getType = Object.prototype.toString,
		isString = function(obj) {
			return (typeof obj) === 'string';
		},
		isArray = function(obj) {
			return getType.call(obj) === '[object Array]';
		},
		isObject = function(obj) {
			return getType.call(obj) === '[object Object]';
		},
		isFunction = function(obj) {
			return getType.call(obj) === '[object Function]';
		},
		baseJsUrl,
		getRootPath = function() {
			var curWwwPath = window.document.location.href,
				pathName = window.document.location.pathname,
				pos = curWwwPath.indexOf(pathName),
				localhostPaht = curWwwPath.substring(0, pos),
				projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
			return (localhostPaht + projectName);
		};

	//存储已经加载好的模块
	var modCache = {};

	// 关键函数
	var require = function(deps, callback) {
		var params = [],
			depCount = 0,
			doc = document,
			// scripts = doc.getElementsByTagName('script'),
			// modName = doc.currentScript.id || scripts[scripts.length - 1].getAttribute('id'), //获取当前正在执行的脚本名
			modName = doc.currentScript.id,
			loadModManage = function(i, deps) {
				depCount++;
				loadModule(deps, function(param) {
					params[i] = param;
					depCount--;
					if (depCount == 0) {
						saveModule(modName, params, callback);
					}
				});
			};

		//依赖模块的参数类型可能是元素为字符串的数组也可能是字符串也可能没依赖
		if (isArray(deps)) {
			for (var i = 0, len = deps.length; i < len; i++) {
				loadModManage(i, deps[i]);
			}
		} else if (isString(deps)) {
			loadModManage(0, deps);
		} else {
			callback = deps;
			setTimeout(function() {
				saveModule(modName, null, callback);
			}, 0);
		}
	};

	// 获取模块真实路径
	var getRealPath = function(modName) {
		var pathName = global.location.pathname,
			pathNames = pathName.split('/'),
			baseUrl = pathName.replace(pathNames[pathNames.length - 1], ''),
			modNames = modName.split('/');

		url = baseUrl + modName.replace(/\.\//, '');
		baseJsUrl = url.replace(modNames[modNames.length - 1], '');
		if (url.indexOf('.js') == -1) url += '.js';
		getRealPath = function(modName) {
			if (/\.\//g.test(modName)) {
				url = baseJsUrl + modName.replace(/\.\//, '');
			} else if (/^\//.test(modName)) {
				url = getRootPath() + modName;
			} else {
				url = baseJsUrl + modName;
			}

			if (url.indexOf('.js') == -1) url += '.js';
			return url;
		};
		return url;
	};
	// 通过动态创建script来异步执行模块
	var execScript = function(modName, url) {
		var doc = document,
			oScript = doc.createElement('script');
		oScript.id = modName;
		oScript.async = true;
		oScript.src = url;
		doc.body.appendChild(oScript);
	};

	//加载依赖模块
	var loadModule = function(modName, callback) {
		var url = getRealPath(modName),
			mod;

		//如果该模块已经被加载
		if (modCache[modName]) {
			mod = modCache[modName];
			if (mod.status == 'loaded') {
				setTimeout(callback(this.params), 0);
			} else {
				//如果未到加载状态直接往onLoad插入值，在依赖项加载好后会解除依赖
				mod.onload.push(callback);
			}
		} else {
			mod = modCache[modName] = {
				modName: modName,
				status: 'loading',
				out: null,
				onload: [callback]
			};
			// 动态执行js
			execScript(modName, url);
		}
	};

	/**
	 *@param {String} modName the name of module
	 *@param {Array}  params the params will be delivered to the callback of require or define
	 *@param {Function} callBack the is also a param in require or define
	 */
	var saveModule = function(modName, params, callback) {
		var mod, fn;
		if (modCache.hasOwnProperty(modName)) {
			mod = modCache[modName];
			mod.status = 'loaded';
			if (isObject(callback)) {
				mod.out = callback;
			} else if (isFunction(callback)) {
				//暴露模块
				mod.out = callback.apply(global, params);
			}

			while (fn = mod.onload.shift()) {
				fn(mod.out);
			}
		} else {
			callback && callback.apply(global, params);

		}
	};

	// 为了避免手动引入入口script，根据引入框架的data-main来指定入口script
	var curScript = function() {
		var doc = document,
			driveMod = doc.currentScript.getAttribute('data-main') || doc.getElementsByTagName('script')[0].getAttribute('data-main'),
			oScript = doc.createElement('script'),
			url = getRealPath(driveMod);
		execScript(driveMod, url);
	};
	curScript(); //从入口开始执行

	global.require = require;
	global.define = require;
})(this);