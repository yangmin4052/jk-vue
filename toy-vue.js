export class ToyVue {
  constructor(config) {
    this.template = document.querySelector(config.el);
    this.data = reactive(config.data);
    for (const name in config.methods) {
      this[name] = () => {
        config.methods[name].apply(this.data);
      };
    }
    this.traversal(this.template);
  }
  traversal(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim().match(/^{{([\s\S]+)}}$/)) {
        let name = RegExp.$1.trim();
        effect(() => (node.textContent = this.data[name]));
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      let attributes = node.attributes;
      for (const attribute of attributes) {
        if (attribute.name === 'v-model') {
          let name = attribute.value;
          effect(() => (node.value = this.data[name]));
          node.addEventListener('input', (event) => {
            this.data[name] = node.value;
          });
        }
        if (attribute.name.match(/^v\-bind:([\s\S]+)$/)) {
          let attrName = RegExp.$1;
          let name = attribute.value;
          effect(() => node.setAttribute(attrName, this.data[name]));
        }
        if (attribute.name.match(/^v\-on:([\s\S]+)$/)) {
          let eventName = RegExp.$1;
          let fnName = attribute.value;
          effect(() => node.addEventListener(eventName, this[fnName]));
        }
      }
    }
    if (node.childNodes && node.childNodes.length) {
      for (const child of node.childNodes) {
        this.traversal(child);
      }
    }
  }
}

let effects = new Map();
let currentEffect = null;

function effect(fn) {
  currentEffect = fn;
  fn();
  currentEffect = null;
}

function reactive(object) {
  let observed = new Proxy(object, {
    get(obj, prop) {
      if (currentEffect) {
        if (!effects.has(obj)) {
          effects.set(obj, new Map());
        }
        if (!effects.get(obj).has(prop)) {
          effects.get(obj).set(prop, new Array());
        }
        effects.get(obj).get(prop).push(currentEffect);
      }
      return obj[prop];
    },
    set(obj, prop, value) {
      obj[prop] = value;
      if (effects.has(obj) && effects.get(obj).has(prop)) {
        for (const effect of effects.get(obj).get(prop)) {
          effect();
          console.log('=========');
        }
      }
      return value;
    }
  });
  return observed;
}
let dummy;
const counter = reactive({ num: 0 });
effect(() => {
  dummy = counter.num;
});
let dummy2;
const counter2 = reactive({ num: 0 });
effect(() => {
  dummy2 = counter2.num;
});
console.log(dummy);
counter.num = 8;
console.log(dummy);
