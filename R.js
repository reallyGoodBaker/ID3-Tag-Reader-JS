function R (...initArgs) {
      if (!initArgs.length) return new R.ref.init(...initArgs);
      if (typeof initArgs[0] === 'string') {
            let res = null;
            try {
                  res = document.querySelectorAll(initArgs[0]);
            } catch (error) {
                  res = fetch(initArgs[0], initArgs[1]);
            }
            if (res.length == 1) return res[0];
            return res;
      }
}

/**
 * @private
 */
R.ref = R.prototype = {
      /**
       * @private
       */
      init: function init(...initArgs){}
}

R.EventEmitter = class EventEmitter {
      /**
       * @private
       */
      events = {}

      on(eventFlag, handler){
            let e = this.events[eventFlag];
            if (!e) {
                  this.events[eventFlag] = [handler];
                  return ;
            }
            e.forEach(element => { if (element === handler) return ;});
            e.push(handler);
            return ;
      }

      off(eventFlag, handler){
            if (!handler) this.offAll(eventFlag);
            this.offSingle(eventFlag, handler);
      }

      /**
       * @private
       */
      offSingle(eventFlag, handler){
            let e = this.events[eventFlag];
            if (!e) return ;
            this.events[eventFlag] = e.reduce((a, c) => {
                  if (c !== handler) return (a.push(c), a);
            }, []);
      }

      /**
       * @private
       */
      offAll(eventFlag){
            let e = this.events[eventFlag];
            if (!e) return ;
            this.events[eventFlag] = null;
      }

      trigger(eventFlag, ...callbackArgs){
            let e = this.events[eventFlag];
            if (!e) return ;
            e.forEach(handler => handler.call(this, ...callbackArgs));
      }
}

R.ref.init.prototype = R.ref;

let __gen__ = 0;
let __innerEM = new R.EventEmitter();
let __ticTac = true;

R.Component = class Component extends HTMLElement{
      constructor () {
            __gen__++;
            super();
            __innerEM.on('mountComponent', this.onWillMount);
      }

      /**
       * @typedef {Object} ComponentContext
       * @property {}
       */

      /**
       * @override
       * @argument {} ctx
       */
      onWillMount(ctx){
            //Your code here
      }

      /**
       * @override
       */
      onWillUnmount(){
            //Your code here
      }

      remove(){
            __innerEM.on('unmountComponent', () => {
                  this.onWillUnmount();
                  super.remove();
            });
            __gen__--;
      }
}

/**
 * 
 * @param {HTMLElement} source 
 * @param {HTMLElement} target 
 */
R.mount = function (source, target) {
      if (source instanceof HTMLTemplateElement) target.appendChild(source.content); else target.appendChild(source);
      __innerEM.trigger('mountComponent');
      __innerEM.off('mountComponent');
}

R.unmount = function () {
      __innerEM.trigger('unmountComponent');
      __innerEM.off('unmountComponent');
}

function renderOnce(s, t) {
      if (!__ticTac) throw Error('Runtime error, please refresh the page');
      __ticTac = !__ticTac;
      t.appendChild(s);
}

R.define = function (tagName, ClassConstructor) {
      if(typeof tagName === 'string') return customElements.define(tagName, ClassConstructor);
      return customElements.define(`c-${ClassConstructor.name}`, ClassConstructor);
}

export default R;